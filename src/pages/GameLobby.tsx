import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, Activity, Clock, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  name: string;
  score: number;
  joined_at: string;
}

interface Game {
  id: string;
  game_pin: string;
  quiz_id: string;
  status: string;
  current_question_index: number;
}

export default function GameLobby() {
  const { pin, playerName: urlPlayerName } = useParams();
  const navigate = useNavigate();
  const playerName = decodeURIComponent(urlPlayerName || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real players and game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!pin || !playerName) {
        setError('Missing game PIN or player name');
        setLoading(false);
        return;
      }

      try {
        // Get game data
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('game_pin', pin)
          .single();

        if (gameError || !gameData) {
          setError('Game not found');
          setLoading(false);
          return;
        }

        setGame(gameData);

        // Load players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameData.id)
          .order('joined_at', { ascending: true });

        if (playersError) {
          console.error('Error loading players:', playersError);
        } else if (playersData) {
          setPlayers(playersData);
        }

        setLoading(false);

        // Check if game has started
        if (gameData.status === 'playing') {
          setGameStarted(true);
          startCountdown();
        }

      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Failed to load game data');
        setLoading(false);
      }
    };

    loadGameData();
  }, [pin, playerName]);

  // Subscribe to real-time game and player updates
  useEffect(() => {
    if (!game?.id) return;

    console.log(`Setting up real-time subscription for game ${game.id} - Anonymous user can subscribe:`, true);

    // Debounced player updates to prevent spam
    let playerUpdateTimeout: NodeJS.Timeout;
    const debouncedPlayerUpdate = () => {
      clearTimeout(playerUpdateTimeout);
      playerUpdateTimeout = setTimeout(() => {
        loadPlayers();
      }, 300);
    };

    // Set up real-time subscription - works for anonymous users
    const gameChannel = supabase
      .channel(`game-lobby-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`
        },
        (payload) => {
          console.log('Game state update received:', payload.new);
          const updatedGame = payload.new as Game;
          setGame(updatedGame);
          
          if (updatedGame.status === 'playing' && !gameStarted) {
            console.log('Game started! Triggering countdown...');
            setGameStarted(true);
            startCountdown();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        debouncedPlayerUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        debouncedPlayerUpdate
      )
      .subscribe((status) => {
        console.log('GameLobby subscription status:', status);
      });

    const loadPlayers = async () => {
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .order('joined_at', { ascending: true });

      if (playersData) {
        setPlayers(playersData);
      }
    };

    // Fallback polling to ensure game state updates are received
    // This is crucial for anonymous players in case real-time fails
    const pollInterval = setInterval(async () => {
      if (gameStarted) return; // Stop polling once game has started
      
      try {
        const { data: gameData } = await supabase
          .from('games')
          .select('*')
          .eq('id', game.id)
          .single();
        
        if (gameData && gameData.status === 'playing' && !gameStarted) {
          console.log('Game started detected via polling!');
          setGame(gameData);
          setGameStarted(true);
          startCountdown();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearTimeout(playerUpdateTimeout);
      clearInterval(pollInterval);
      supabase.removeChannel(gameChannel);
    };
  }, [game?.id, gameStarted]);

  const startCountdown = () => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate(`/play/${pin}/${encodeURIComponent(playerName)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Loading...</h2>
              <p className="text-muted-foreground">Connecting to game lobby</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div 
      className="min-h-screen" 
      style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 text-3d">
              {gameStarted ? `Starting in ${countdown}...` : 'Waiting for Game to Start'}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/80">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <Wifi className="h-4 w-4 mr-2" />
                PIN: {pin}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 animate-pulse">
                <Activity className="h-4 w-4 mr-2" />
                Live
              </Badge>
            </div>
          </div>

          {/* Game Status */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8 text-center">
              {gameStarted ? (
                <div className="space-y-4">
                  <div className="text-6xl mb-4 animate-bounce">🚀</div>
                  <h2 className="text-3xl font-bold text-primary mb-4">Get Ready!</h2>
                  <div className="text-8xl font-bold text-primary animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    The game is starting...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h2 className="text-2xl font-bold">Waiting for Host</h2>
                  <p className="text-muted-foreground">
                    The host will start the game when ready
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players Grid */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {players.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`px-4 py-3 rounded-lg font-semibold text-center animate-slide-up ${
                      player.name === playerName
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white animate-pulse-glow'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                    }`}
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {player.name} {player.name === playerName && '(You)'}
                    </div>
                  </div>
                ))}
              </div>
              
              {players.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>Waiting for more players to join...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fixed Position Elements */}
        <div className="fixed bottom-4 left-4 bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold border border-white/20">
          {playerName}
        </div>

        <div className="fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-bold text-xl border border-white/20">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            0
          </div>
        </div>
      </div>
    </div>
  );
}