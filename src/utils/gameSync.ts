import { supabase } from '@/integrations/supabase/client';

export interface GameState {
  id: string;
  game_pin: string;
  quiz_id: string;
  status: 'waiting' | 'playing' | 'finished';
  current_question_index: number;
  host_id: string | null;
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  game_id: string;
}

/**
 * Synchronize game state between host and players
 */
export class GameSync {
  private gamePin: string;
  private callbacks: {
    onGameStateChange?: (game: GameState) => void;
    onPlayersChange?: (players: PlayerState[]) => void;
  } = {};

  constructor(gamePin: string) {
    this.gamePin = gamePin;
  }

  /**
   * Set up real-time subscriptions for game state changes
   */
  async subscribe(callbacks: {
    onGameStateChange?: (game: GameState) => void;
    onPlayersChange?: (players: PlayerState[]) => void;
  }) {
    this.callbacks = callbacks;

    // Get initial game data
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('game_pin', this.gamePin)
      .single();

    if (!game) throw new Error('Game not found');

    // Get initial players
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id);

    // Call initial callbacks
    if (this.callbacks.onGameStateChange) {
      this.callbacks.onGameStateChange({
        id: game.id,
        game_pin: game.game_pin,
        quiz_id: game.quiz_id,
        status: game.status as 'waiting' | 'playing' | 'finished',
        current_question_index: game.current_question_index,
        host_id: game.host_id
      });
    }
    if (this.callbacks.onPlayersChange && players) {
      this.callbacks.onPlayersChange(players);
    }

    // Set up real-time subscriptions
    const gameChannel = supabase
      .channel(`game-sync-${this.gamePin}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `game_pin=eq.${this.gamePin}`
        },
        (payload) => {
          if (this.callbacks.onGameStateChange) {
            const gameData = payload.new as any;
            this.callbacks.onGameStateChange({
              id: gameData.id,
              game_pin: gameData.game_pin,
              quiz_id: gameData.quiz_id,
              status: gameData.status as 'waiting' | 'playing' | 'finished',
              current_question_index: gameData.current_question_index,
              host_id: gameData.host_id
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players'
        },
        async () => {
          // Reload players when changes occur
          const { data: updatedPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', game.id);

          if (this.callbacks.onPlayersChange && updatedPlayers) {
            this.callbacks.onPlayersChange(updatedPlayers);
          }
        }
      )
      .subscribe();

    return gameChannel;
  }

  /**
   * Update game status (host only)
   */
  async updateGameStatus(status: 'waiting' | 'playing' | 'finished', questionIndex?: number) {
    const updateData: any = { status };
    if (questionIndex !== undefined) {
      updateData.current_question_index = questionIndex;
    }
    if (status === 'finished') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('games')
      .update(updateData)
      .eq('game_pin', this.gamePin);

    if (error) {
      console.error('Error updating game status:', error);
      throw error;
    }
  }

  /**
   * Update player score
   */
  async updatePlayerScore(playerId: string, score: number) {
    const { error } = await supabase
      .from('players')
      .update({ score })
      .eq('id', playerId);

    if (error) {
      console.error('Error updating player score:', error);
      throw error;
    }
  }

  /**
   * Record player answer
   */
  async recordAnswer(playerId: string, questionId: string, isCorrect: boolean, scoreAwarded: number, timeTaken: number) {
    const { error } = await supabase
      .from('answers')
      .insert({
        player_id: playerId,
        question_id: questionId,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        time_taken_ms: timeTaken
      });

    if (error) {
      console.error('Error recording answer:', error);
      throw error;
    }
  }
}