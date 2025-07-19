import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaderboard } from '@/components/Leaderboard';
import { PlayerJoinNotification, PlayerCounter } from '@/components/PlayerJoinNotification';
import { GamePinDisplay, PinGenerator } from '@/components/GamePinDisplay';
import Logo from '@/components/Logo';
import { Users, Play, SkipForward, Trophy, Clock, Eye, Settings, Pause } from 'lucide-react';
import { useQuizBackground } from '@/contexts/QuizBackgroundContext';
import { supabase } from '@/integrations/supabase/client';

// Sample quiz data
const sampleQuiz = {
  id: '1',
  title: 'General Knowledge Quiz',
  questions: [
    {
      id: '1',
      question: 'What is your favorite season?',
      answers: ['Winter', 'Spring', 'Summer', 'Fall'],
      correctAnswer: 2,
      timeLimit: 20,
      points: 1000
    },
    {
      id: '2',
      question: 'Which planet is known as the Red Planet?',
      answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1,
      timeLimit: 15,
      points: 1200
    },
    {
      id: '3',
      question: 'What is 2 + 2?',
      answers: ['3', '4', '5', '6'],
      correctAnswer: 1,
      timeLimit: 10,
      points: 800
    }
  ]
};

// Remove sample players - only use real data from database

export default function HostDashboard() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getBackgroundStyle, resetBackground, setQuizBackground } = useQuizBackground();
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'question' | 'results' | 'leaderboard'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [players, setPlayers] = useState([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [pin, setPin] = useState('123456');
  const [isPaused, setIsPaused] = useState(false);
  
  // 🚦 Ready state tracking for perfect synchronization
  const readyPlayers = useRef<Set<string>>(new Set());
  const [waitingForReady, setWaitingForReady] = useState(false);

  // Load quiz data and set background
  useEffect(() => {
    const loadQuizAndGame = async () => {
      if (!quizId) return;

      try {
        // First check localStorage for quiz data
        const savedQuizData = localStorage.getItem(`quiz_${quizId}`);
        let quizData = null;
        
        if (savedQuizData) {
          quizData = JSON.parse(savedQuizData);
        }

        if (quizData) {
          setQuiz(quizData);

          // Check if there's already a game for this quiz
          const { data: existingGame } = await supabase
            .from('games')
            .select('game_pin')
            .eq('quiz_id', quizId)
            .single();

          if (existingGame) {
            setPin(existingGame.game_pin);
          } else if (quizData.pin) {
            // Check if the PIN from localStorage corresponds to an active game
            const { data: gameByPin } = await supabase
              .from('games')
              .select('game_pin')
              .eq('game_pin', quizData.pin)
              .single();

            if (gameByPin) {
              setPin(quizData.pin);
            } else {
              // Create a new game with the existing PIN or generate new one
              await createNewGame(quizData);
            }
          } else {
            // Create a new game
            await createNewGame(quizData);
          }

          // Set background based on quiz data
          if (quizData.customBackground) {
            setQuizBackground('custom', quizData.customBackground);
          }
        }
      } catch (error) {
        console.error('Error loading quiz and game:', error);
      }
    };

    const createNewGame = async (quizData: any) => {
      try {
        // Generate PIN
        const { data: pinData } = await supabase.rpc('generate_game_pin');
        const gamePin = pinData;

        // Create game in Supabase
        const { error: gameError } = await supabase
          .from('games')
          .insert({
            game_pin: gamePin,
            quiz_id: quizId,
            host_id: null, // Allow anonymous hosting
            status: 'waiting'
          });

        if (gameError) {
          console.error('Error creating game:', gameError);
          return;
        }

        setPin(gamePin);

        // Update localStorage
        const updatedQuiz = { ...quizData, pin: gamePin };
        setQuiz(updatedQuiz);
        localStorage.setItem(`quiz_${quizId}`, JSON.stringify(updatedQuiz));
        localStorage.setItem(`pin_${gamePin}`, quizId);
      } catch (error) {
        console.error('Error creating new game:', error);
      }
    };

    loadQuizAndGame();
  }, [quizId, setQuizBackground]);

  // Reset background when leaving this page
  // Subscribe to real-time player updates and game state
  useEffect(() => {
    if (!pin) return;

    const loadPlayersAndGameState = async () => {
      try {
        const { data: game } = await supabase
          .from('games')
          .select('*')
          .eq('game_pin', pin)
          .single();

        if (!game) return;

        // Update game state based on database
        if (game.status === 'playing' && gameState === 'lobby') {
          setGameState('question');
          setCurrentQuestionIndex(game.current_question_index >= 0 ? game.current_question_index : 0);
        }

        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', game.id);

        if (playersData) {
          const formattedPlayers = playersData.map(player => ({
            id: player.id,
            name: player.name,
            score: player.score || 0,
            streak: 0,
            answered: false,
            isOnline: true,
            joinedAt: new Date(player.joined_at).getTime(),
            lastAnswerCorrect: false,
            correctAnswers: 0
          }));
          setPlayers(formattedPlayers);
        }
      } catch (error) {
        console.error('Error loading players and game state:', error);
      }
    };

    // Load initial data
    loadPlayersAndGameState();

    // Subscribe to real-time updates with debouncing
    let updateTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        loadPlayersAndGameState();
      }, 500); // Debounce updates by 500ms
    };

    const playersChannel = supabase
      .channel(`players-updates-${pin}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players'
        },
        debouncedUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players'
        },
        debouncedUpdate
      )
      .subscribe();

    const gameChannel = supabase
      .channel(`game-state-updates-${pin}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `game_pin=eq.${pin}`
        },
        debouncedUpdate
      )
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
    };
  }, [pin, gameState]);

  useEffect(() => {
    return () => resetBackground();
  }, [resetBackground]);

  const currentQuestion = (quiz?.questions?.[currentQuestionIndex]) || sampleQuiz.questions[currentQuestionIndex] || { question: "Loading...", answers: [], correctAnswer: 0, timeLimit: 20, points: 1000 };
  const totalQuestions = quiz?.questions?.length || sampleQuiz.questions.length;
  const answeredCount = players.filter(p => p.answered).length;
  const answerProgress = players.length > 0 ? (answeredCount / players.length) * 100 : 0;

  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0 && !isPaused) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft, isPaused]);

  // 🚦 Function to start question timer only when all players are ready
  const startQuestionTimer = async (gameId: string) => {
    try {
      console.log('[HOST] 🚦 All players ready - starting question timer');
      
      // Update status to 'playing'
      await supabase
        .from('games')
        .update({ status: 'playing' })
        .eq('id', gameId);

      // Send game started and first question
      const channel = supabase.channel(`game:${pin}`);
      await channel.send({
        type: 'broadcast',
        event: 'game_started',
        payload: { status: 'playing', gamePin: pin }
      });
      
      await channel.send({
        type: 'broadcast',
        event: 'question',
        payload: { index: 0, gamePin: pin }
      });

      setGameState('question');
      setCurrentQuestionIndex(0);
      setTimeLeft(currentQuestion.timeLimit || 20);
      setWaitingForReady(false);
      
      console.log('[HOST] 🚦 Question timer started - all players synchronized');
    } catch (error) {
      console.error('[HOST] Error starting question timer:', error);
    }
  };

  const startGame = async () => {
    try {
      console.log('[HOST] Starting game for PIN:', String(pin).trim());
      
      // Reset ready tracking
      readyPlayers.current.clear();
      setWaitingForReady(true);
      
      // Update game status to 'starting' first - this triggers countdown
      const { data: game, error: gameSelectError } = await supabase
        .from('games')
        .select('id')
        .eq('game_pin', String(pin).trim())
        .maybeSingle();

      if (gameSelectError || !game) {
        console.error('[HOST] Error finding game:', gameSelectError);
        return;
      }

      console.log('[HOST] Found game ID:', game.id);

      // Set to 'starting' status first
      const { data: updateResult, error: updateError } = await supabase
        .from('games')
        .update({
          status: 'starting',
          current_question_index: 0
        })
        .eq('id', game.id)
        .select();

      console.log('[HOST] Update result:', { data: updateResult, error: updateError });

      if (updateError) {
        console.error('[HOST] Error updating game:', updateError);
        return;
      }

      // Set up ready signal listener
      const channel = supabase.channel(`game:${pin}`);
      
      channel
        .on('broadcast', { event: 'ready_for_q1' }, (payload) => {
          const playerId = payload.payload?.playerId;
          const playerName = payload.payload?.playerName;
          
          console.log('🚦 [HOST] Received ready signal from:', playerName, playerId);
          
          if (playerId) {
            readyPlayers.current.add(playerId);
            console.log(`🚦 [HOST] Ready count: ${readyPlayers.current.size}/${players.length}`);
            
            // Check if all connected players are ready
            if (readyPlayers.current.size >= players.length && players.length > 0) {
              console.log('🚦 [HOST] All players ready! Starting question timer...');
              startQuestionTimer(game.id);
              supabase.removeChannel(channel);
            }
          }
        })
        .subscribe();

      // Broadcast countdown event
      console.log('[HOST] Broadcasting countdown to channel game:' + pin);
      
      await channel.send({
        type: 'broadcast',
        event: 'countdown',
        payload: { seconds: 3, gamePin: pin }
      });

      setGameState('countdown');
      
      // Fallback: if no players respond within 10 seconds, start anyway
      setTimeout(() => {
        if (waitingForReady && readyPlayers.current.size === 0) {
          console.log('🚦 [HOST] Timeout - starting without ready signals');
          startQuestionTimer(game.id);
          supabase.removeChannel(channel);
        }
      }, 10000);
      
      console.log('[HOST] 🚦 Countdown initiated - waiting for all players to be ready');
    } catch (error) {
      console.error('[HOST] Error starting game:', error);
    }
  };

  const nextQuestion = async () => {
    const totalQuestions = quiz?.questions?.length || sampleQuiz.questions.length;
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < totalQuestions) {
      try {
        console.log('[HOST] Moving to question', nextIndex);
        
        // Update game in database
        const { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('game_pin', pin)
          .single();

        if (game) {
          const { error: updateError } = await supabase
            .from('games')
            .update({
              current_question_index: nextIndex
            })
            .eq('id', game.id);
            
          if (updateError) {
            console.error('[HOST] Error updating question index:', updateError);
            return;
          }
        }

        // Broadcast question change to all players
        console.log('[HOST] Broadcasting question', nextIndex, 'to channel game:' + pin);
        const channel = supabase.channel(`game:${pin}`);
        await channel.send({
          type: 'broadcast',
          event: 'question',
          payload: { index: nextIndex, gamePin: pin }
        });

        setCurrentQuestionIndex(nextIndex);
        setGameState('question');
        const nextQ = quiz?.questions?.[nextIndex] || sampleQuiz.questions[nextIndex];
        setTimeLeft(nextQ.timeLimit || 20);
        // Reset answered status
        setPlayers(prev => prev.map(p => ({ ...p, answered: false })));
        
        console.log('[HOST] Successfully moved to question', nextIndex);
      } catch (error) {
        console.error('[HOST] Error moving to next question:', error);
      }
    } else {
      // End the game
      try {
        console.log('[HOST] Game finished, updating status');
        
        const { data: game } = await supabase
          .from('games')
          .select('id')
          .eq('game_pin', pin)
          .single();

        if (game) {
          await supabase
            .from('games')
            .update({
              status: 'finished',
              ended_at: new Date().toISOString()
            })
            .eq('id', game.id);
            
          // Broadcast game finished
          const channel = supabase.channel(`game:${pin}`);
          await channel.send({
            type: 'broadcast',
            event: 'game_finished',
            payload: { gamePin: pin }
          });
        }
      } catch (error) {
        console.error('[HOST] Error ending game:', error);
      }
      
      navigate(`/final-results/${quiz?.pin || pin}`);
    }
  };

  const showResults = () => {
    setGameState('results');
  };

  const showLeaderboard = () => {
    setGameState('leaderboard');
  };

  const answerColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl p-8 text-center max-w-lg">
          <CardContent>
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold mb-4">Get Ready!</h2>
            {waitingForReady ? (
              <>
                <p className="text-xl text-muted-foreground mb-6">Waiting for all players to load...</p>
                <div className="text-4xl font-bold text-primary mb-4">
                  🚦 {readyPlayers.current.size}/{players.length} Ready
                </div>
                <div className="text-sm text-muted-foreground">
                  Question will start when all players are ready
                </div>
              </>
            ) : (
              <>
                <p className="text-xl text-muted-foreground mb-6">Question 1 starting in...</p>
                <div className="text-8xl font-bold text-primary animate-pulse">3</div>
                <p className="text-lg text-muted-foreground mt-4">All players will see the question simultaneously!</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <PlayerJoinNotification players={players} />
        
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary/80 shadow-lg backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Title */}
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <h1 className="text-2xl font-bold text-white">{quiz?.title || 'Abraj Quiz'}</h1>
              </div>
              
              {/* Game PIN Badge */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-white/80 text-sm">Game PIN</p>
                <p className="text-2xl font-bold text-white">{pin}</p>
              </div>
              
              {/* Settings */}
              <div className="flex gap-3">
                <PinGenerator onPinGenerated={(newPin) => {
                  setPin(newPin);
                  // Update the quiz data with new PIN and store mapping
                  if (quiz && quizId) {
                    const updatedQuiz = { ...quiz, pin: newPin };
                    setQuiz(updatedQuiz);
                    localStorage.setItem(`quiz_${quizId}`, JSON.stringify(updatedQuiz));
                    localStorage.setItem(`pin_${newPin}`, quizId);
                  }
                }} />
                <Button
                  variant="outline"
                  onClick={() => navigate('/create')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Quiz
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Game PIN & QR */}
            <div className="lg:col-span-1">
              <GamePinDisplay 
                pin={pin}
                animated={true}
                className="sticky top-4"
              />
            </div>

            {/* Right Column: Players & Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Player Counter */}
              <PlayerCounter 
                players={players}
                maxPlayers={50}
                showOnlineStatus={true}
              />

              {/* Connected Players Grid */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Connected Players ({players.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {players.map((player, index) => (
                      <div 
                        key={player.id} 
                        className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary px-3 py-2 rounded-lg font-semibold text-center animate-slide-up border border-primary/20"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {player.name}
                        </div>
                      </div>
                    ))}
                    {players.length === 0 && (
                      <div className="col-span-full text-center py-8">
                        <div className="text-4xl mb-2">🎮</div>
                        <p className="text-muted-foreground">Waiting for players to join...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Share the PIN or QR code with your players!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Game Controls */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Ready to start?</h3>
                      <p className="text-muted-foreground">
                        {players.length > 0 
                          ? `${players.length} player${players.length !== 1 ? 's' : ''} waiting to play!`
                          : 'Waiting for players to join...'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={startGame}
                      disabled={players.length === 0}
                      size="lg"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 text-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'question') {
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Host Controls */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-2xl font-bold text-primary">{timeLeft}s</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPaused(!isPaused)}
                      disabled={timeLeft === 0}
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button variant="game" onClick={showResults}>
                      <Eye className="h-4 w-4" />
                      Show Results
                    </Button>
                    <Button variant="game" onClick={nextQuestion}>
                      <SkipForward className="h-4 w-4" />
                      Next
                    </Button>
                  </div>
                </div>
                
                {/* Answer Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Answers: {answeredCount}/{players.length}</span>
                    <span>{Math.round(answerProgress)}%</span>
                  </div>
                  <Progress value={answerProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Question Display */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-8">{currentQuestion.question}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(currentQuestion?.answers || []).map((answer, index) => (
                    <div 
                      key={index} 
                      className={`p-6 rounded-xl text-white font-bold text-xl ${answerColors[index]}`}
                    >
                      {answer}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Live Player Stats with Leaderboard */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-game">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Leaderboard</span>
                  <div className="text-sm text-muted-foreground">
                    {answeredCount}/{players.length} answered
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard 
                  players={players}
                  currentQuestionNumber={currentQuestionIndex + 1}
                  totalQuestions={totalQuestions}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Results */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-8">{currentQuestion.question}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {(currentQuestion?.answers || []).map((answer, index) => (
                    <div 
                      key={index} 
                      className={`p-6 rounded-xl text-white font-bold text-xl relative ${answerColors[index]} ${
                        index === currentQuestion.correctAnswer ? 'ring-4 ring-white' : ''
                      }`}
                    >
                      {answer}
                      {index === currentQuestion.correctAnswer && (
                        <div className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full p-2">
                          ✓
                        </div>
                      )}
                      <div className="text-sm mt-2 opacity-90">
                        {Math.floor(Math.random() * players.length)} players
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button variant="game" onClick={showLeaderboard}>
                    <Trophy className="h-4 w-4" />
                    Show Leaderboard
                  </Button>
                  <Button variant="game" onClick={nextQuestion}>
                    <SkipForward className="h-4 w-4" />
                    Next Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}