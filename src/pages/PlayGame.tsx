import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnswerButton } from '@/components/AnswerButton';
import { Timer } from '@/components/Timer';
import { SoundEffects } from '@/components/SoundEffects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { Trophy, Users, Clock, X, Loader2 } from 'lucide-react';
import { useQuizBackground } from '@/contexts/QuizBackgroundContext';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  question_text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  time_limit: number;
  points?: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface Game {
  id: string;
  game_pin: string;
  quiz_id: string;
  current_question_index: number;
  status: string;
}

interface Player {
  id: string;
  name: string;
  score: number;
}

export default function PlayGame() {
  const { pin, playerName } = useParams();
  const navigate = useNavigate();
  const { getBackgroundStyle, resetBackground } = useQuizBackground();
  
  // Game state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'question' | 'result' | 'finished'>('waiting');
  const [timeBonus, setTimeBonus] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [soundTrigger, setSoundTrigger] = useState<'correct' | 'incorrect' | 'timeup' | null>(null);

  // Reset background when leaving this page
  useEffect(() => {
    return () => resetBackground();
  }, [resetBackground]);

  // Load game data and subscribe to updates
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

        // Get quiz data with questions
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            questions (
              id,
              question_text,
              options,
              time_limit
            )
          `)
          .eq('id', gameData.quiz_id)
          .single();

        if (quizError || !quizData) {
          console.error('Quiz error:', quizError);
          setError('Quiz not found');
          setLoading(false);
          return;
        }

        // Transform questions to ensure proper format
        const transformedQuiz = {
          ...quizData,
          questions: (quizData.questions || []).map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            time_limit: q.time_limit || 6,
            points: q.options?.points || 1000,
            options: q.options?.type === 'true-false'
              ? [
                  { text: 'True', isCorrect: q.options.correctAnswer === true },
                  { text: 'False', isCorrect: q.options.correctAnswer === false }
                ]
              : q.options?.type === 'multiple-choice' && Array.isArray(q.options?.answers)
              ? q.options.answers.map((answer: string, idx: number) => ({
                  text: answer,
                  isCorrect: q.options?.correctAnswer === idx
                }))
              : [
                  { text: 'Option 1', isCorrect: true },
                  { text: 'Option 2', isCorrect: false },
                  { text: 'Option 3', isCorrect: false },
                  { text: 'Option 4', isCorrect: false }
                ]
          }))
        };

        console.log('Transformed quiz:', transformedQuiz);
        setQuiz(transformedQuiz as Quiz);

        // Get player data
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameData.id)
          .eq('name', decodeURIComponent(playerName))
          .single();

        if (playerError || !playerData) {
          setError('Player not found in this game');
          setLoading(false);
          return;
        }

        setPlayer(playerData);
        setScore(playerData.score || 0);
        setCurrentQuestionIndex(gameData.current_question_index);
        
        setLoading(false);
        
        // Check game status and set appropriate state
        if (gameData.status === 'waiting') {
          setGameState('waiting');
        } else if (gameData.status === 'playing') {
          setGameState('question');
          setQuestionStartTime(Date.now());
        } else if (gameData.status === 'finished') {
          navigate(`/final-results/${pin}`);
        }

      } catch (err) {
        console.error('Error loading game data:', err);
        setError('Failed to load game data');
        setLoading(false);
      }
    };

    loadGameData();
  }, [pin, playerName, navigate]);

  // Subscribe to real-time game updates with robust fallback
  useEffect(() => {
    if (!game?.id || !pin) return;

    console.log(`🎮 Setting up PlayGame monitoring for PIN: ${pin}, GameID: ${game.id}`);
    console.log(`🎮 Current game state: ${gameState}, Question index: ${currentQuestionIndex}`);

    let pollInterval: NodeJS.Timeout;
    let gameChannel: any;

    // Robust polling function - primary method for game state sync
    const pollGameState = async () => {
      try {
        console.log(`🔍 PlayGame polling for PIN: ${pin}`);
        
        const { data: gameData, error } = await supabase
          .from('games')
          .select('*')
          .eq('game_pin', pin)
          .single();

        if (error) {
          console.error('❌ PlayGame polling error:', error);
          return;
        }

        if (gameData) {
          const statusChanged = gameData.status !== game.status;
          const questionChanged = gameData.current_question_index !== currentQuestionIndex;
          
          console.log(`📊 PlayGame poll result - Status: ${gameData.status} (was: ${game.status}), Question: ${gameData.current_question_index} (was: ${currentQuestionIndex})`);
          
          if (statusChanged || questionChanged) {
            console.log(`🔄 PlayGame state change detected`);
            setGame(gameData);
          }
          
          // Handle state transitions
          if (gameData.status === 'playing' && gameState === 'waiting') {
            console.log('🎮 TRANSITION: waiting → playing');
            setGameState('question');
            setQuestionStartTime(Date.now());
          } else if (gameData.status === 'finished') {
            console.log('🏁 GAME FINISHED - navigating to results');
            navigate(`/final-results/${pin}`);
            return; // Stop polling
          }
          
          // Handle question progression - always process valid question index changes
          if (questionChanged && gameData.current_question_index >= 0) {
            console.log(`📝 QUESTION CHANGE: ${currentQuestionIndex} → ${gameData.current_question_index}`);
            setCurrentQuestionIndex(gameData.current_question_index);
            setSelectedAnswer(null);
            setShowResult(false);
            setGameState('question');
            setQuestionStartTime(Date.now());
            setSoundTrigger(null);
          }
          
          // Special case: if game just started (status changed to playing) and question index is 0
          if (gameData.status === 'playing' && gameData.current_question_index === 0 && gameState === 'waiting') {
            console.log('🎮 SPECIAL CASE: Game started with Q0');
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setShowResult(false);
            setGameState('question');
            setQuestionStartTime(Date.now());
            setSoundTrigger(null);
          }
        }
      } catch (error) {
        console.error('❌ PlayGame polling exception:', error);
      }
    };

    // Start polling immediately and every 1.5 seconds
    pollGameState();
    pollInterval = setInterval(pollGameState, 1500);

    // Enhanced real-time subscription with broadcast support
    const setupRealtime = () => {
      console.log('🔄 Setting up PlayGame real-time subscription with broadcast support...');
      
      gameChannel = supabase
        .channel(`game:${pin}`) // Match the channel used by host
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `game_pin=eq.${pin}`
          },
          (payload) => {
            const updatedGame = payload.new as any;
            console.log('📡 PlayGame DB update:', updatedGame);
            setGame(updatedGame);
            
            // Handle game state changes via real-time
            if (updatedGame.status === 'playing' && gameState === 'waiting') {
              console.log('🎮 REALTIME DB: waiting → playing');
              setGameState('question');
              setQuestionStartTime(Date.now());
            } else if (updatedGame.status === 'finished') {
              console.log('🏁 REALTIME DB: Game finished');
              navigate(`/final-results/${pin}`);
            }
            
            // Handle question changes via real-time
            if (updatedGame.current_question_index !== currentQuestionIndex && updatedGame.current_question_index >= 0) {
              console.log('📝 REALTIME DB: Question change to:', updatedGame.current_question_index);
              setCurrentQuestionIndex(updatedGame.current_question_index);
              setSelectedAnswer(null);
              setShowResult(false);
              setGameState('question');
              setQuestionStartTime(Date.now());
              setSoundTrigger(null);
            }
            
            // Special case: if game just started (status changed to playing) and question index is 0
            if (updatedGame.status === 'playing' && updatedGame.current_question_index === 0 && gameState === 'waiting') {
              console.log('🎮 REALTIME SPECIAL CASE: Game started with Q0');
              setCurrentQuestionIndex(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setGameState('question');
              setQuestionStartTime(Date.now());
              setSoundTrigger(null);
            }
          }
        )
        .on('broadcast', { event: 'game_started' }, (payload) => {
          console.log('📡 [GUEST] Received game_started broadcast:', payload);
          if (gameState === 'waiting') {
            setGameState('question');
            setQuestionStartTime(Date.now());
          }
        })
        .on('broadcast', { event: 'question' }, (payload) => {
          console.log('📡 [GUEST] Received question broadcast:', payload);
          const questionIndex = payload.payload?.index;
          if (questionIndex !== undefined && questionIndex !== currentQuestionIndex) {
            console.log('📝 BROADCAST: Question change to:', questionIndex);
            setCurrentQuestionIndex(questionIndex);
            setSelectedAnswer(null);
            setShowResult(false);
            setGameState('question');
            setQuestionStartTime(Date.now());
            setSoundTrigger(null);
          }
        })
        .on('broadcast', { event: 'game_finished' }, (payload) => {
          console.log('📡 [GUEST] Received game_finished broadcast:', payload);
          navigate(`/final-results/${pin}`);
        })
        .subscribe((status) => {
          console.log('📡 PlayGame subscription status:', status);
        });
    };

    setupRealtime();

    return () => {
      console.log('🧹 Cleaning up PlayGame monitoring');
      clearInterval(pollInterval);
      if (gameChannel) {
        supabase.removeChannel(gameChannel);
      }
    };
  }, [game?.id, pin, gameState, currentQuestionIndex, navigate]);

  const currentQuestion = quiz?.questions[currentQuestionIndex] || null;
  const isLastQuestion = quiz ? currentQuestionIndex === quiz.questions.length - 1 : false;

  useEffect(() => {
    if (gameState === 'question') {
      const startTime = Date.now();
      setQuestionStartTime(startTime);
      console.log(`📝 Question ${currentQuestionIndex + 1} started at:`, new Date(startTime).toISOString());
    }
  }, [currentQuestionIndex, gameState]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      setSelectedAnswer(-1); // No answer selected
      setSoundTrigger('timeup');
    }
    showQuestionResult();
  };

  const showQuestionResult = async () => {
    setShowResult(true);
    setGameState('result');
    
    if (!currentQuestion) return;
    
    // Find correct answer index
    const correctAnswerIndex = currentQuestion.options.findIndex(option => option.isCorrect);
    const isCorrect = selectedAnswer === correctAnswerIndex;
    
    console.log('Answer check:', {
      selectedAnswer,
      correctAnswerIndex,
      isCorrect,
      options: currentQuestion.options,
      currentQuestion: currentQuestion.question_text
    });
    
    // Update UI immediately for feedback
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      setSoundTrigger('correct');
    } else {
      setStreak(0);
      setSoundTrigger('incorrect');
    }

    // Record the answer without awarding points yet
    // Points will be calculated after all answers are collected
    if (player && currentQuestion) {
      const responseTime = Date.now() - questionStartTime;
      console.log(`Answer recorded - Response time: ${responseTime}ms, Correct: ${isCorrect}`);
      
      await supabase
        .from('answers')
        .insert({
          player_id: player.id,
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          score_awarded: 0, // Will be updated when scores are calculated
          time_taken_ms: responseTime
        });

      // Schedule scoring calculation after a delay to allow other players to answer
      // In a real-time game, this would be triggered by the host or timer
      setTimeout(() => {
        calculateAndAwardScores(currentQuestion.id);
      }, 2000); // 2 second delay to simulate waiting for other players
    }
  };

  // Function to calculate and award points based on relative response times
  const calculateAndAwardScores = async (questionId: string) => {
    if (!game || !player) return;

    console.log('Calculating scores for question:', questionId);

    // Get all answers for this question
    const { data: allAnswers, error } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId);

    if (error || !allAnswers) {
      console.error('Failed to fetch answers for scoring:', error);
      return;
    }

    // Filter correct answers and find fastest time
    const correctAnswers = allAnswers.filter(answer => answer.is_correct);
    
    if (correctAnswers.length === 0) {
      console.log('No correct answers to score');
      return;
    }

    const fastestTime = Math.min(...correctAnswers.map(answer => answer.time_taken_ms));
    console.log(`Fastest correct answer: ${fastestTime}ms from ${correctAnswers.length} correct answers`);

    // Calculate and award scores
    for (const answer of correctAnswers) {
      const ratio = fastestTime / answer.time_taken_ms;
      const baseScore = 1000;
      const calculatedScore = Math.round(baseScore * ratio);
      const finalScore = Math.min(calculatedScore, 1000); // Cap at 1000

      console.log(`Player ${answer.player_id}: ${answer.time_taken_ms}ms, ratio: ${ratio.toFixed(3)}, score: ${finalScore}`);

      // Update player score in database
      try {
        const { error: scoreError } = await supabase.rpc('increment_player_score', {
          player_id_in: answer.player_id,
          score_to_add: finalScore
        });

        if (scoreError) {
          console.error('Failed to update player score:', scoreError);
          continue;
        }

        // Update the answer record with the awarded score
        await supabase
          .from('answers')
          .update({ score_awarded: finalScore })
          .eq('id', answer.id);

        // Update local score if this is the current player
        if (answer.player_id === player.id) {
          setScore(prev => prev + finalScore);
          console.log(`Updated local score: +${finalScore} points`);
        }

      } catch (error) {
        console.error('Error updating score:', error);
      }
    }

    console.log('Score calculation completed');
  };

  const answerColors: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'blue', 'yellow', 'green'];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
              <p className="text-muted-foreground">Please wait while we load the quiz</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-2xl font-bold mb-2">Game Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')} variant="game">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse text-4xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold mb-2">Get Ready!</h2>
              <p className="text-muted-foreground mb-4">The game is about to start...</p>
              <div className="text-lg font-semibold">Welcome, {decodeURIComponent(playerName || '')}!</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Safety check - if no current question AND we're supposed to be showing a question, show error
  if (!currentQuestion && gameState === 'question' && currentQuestionIndex >= 0) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-2xl font-bold mb-2">Game Error</h2>
              <p className="text-muted-foreground mb-4">Question not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If gameState is 'question' but we don't have a valid question yet, show loading
  if (gameState === 'question' && !currentQuestion) {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Loading Question...</h2>
              <p className="text-muted-foreground">Please wait</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'var(--gradient-classroom)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <SoundEffects trigger={soundTrigger} onComplete={() => setSoundTrigger(null)} />
      
      {/* Logo */}
      <div className="absolute top-4 left-4 z-10">
        <Logo size="md" />
      </div>
      
      {/* Exit Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Game Container */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-7xl mx-auto">
          
          {/* Question Section - Top Center */}
          <div className="flex flex-col items-center mb-12">
            <Card className="w-full max-w-4xl bg-white shadow-xl rounded-lg animate-fade-in">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 font-montserrat leading-tight">
                  {currentQuestion.question_text}
                </h2>
              </CardContent>
            </Card>
            
            {/* Question Number */}
            <div className="mt-4 text-white/90 text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {quiz?.questions.length || 0}
            </div>
          </div>

          {/* Timer and Answer Count Row */}
          <div className="flex justify-between items-center mb-12 px-8">
            
            {/* Timer Circle - Left */}
              <div className="relative">
                <div className="w-24 h-24 bg-[#5D2A8E] rounded-full flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <Timer
                      key={`timer-${currentQuestionIndex}-${currentQuestion.id}`} // Force timer reset with key
                      duration={currentQuestion.time_limit}
                      onComplete={handleTimeUp}
                      isActive={gameState === 'question' && !showResult}
                      className="text-2xl font-bold text-white"
                    />
                    <div className="text-xs text-white/80">sec</div>
                  </div>
                </div>
              </div>

            {/* Player Info - Center */}
            <div className="text-center text-white">
              <div className="text-lg font-semibold mb-1">{decodeURIComponent(playerName || '')}</div>
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="h-5 w-5" />
                <span className="text-xl font-bold">{score.toLocaleString()}</span>
              </div>
              {streak > 0 && (
                <div className="mt-2 bg-orange-500/20 px-3 py-1 rounded-full inline-flex items-center gap-2">
                  <span className="text-orange-300">🔥</span>
                  <span className="text-sm">{streak} streak</span>
                </div>
              )}
            </div>

            {/* Answer Count Circle - Right */}
            <div className="w-24 h-24 bg-[#5D2A8E] rounded-full flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {currentQuestion.options.length}
                </div>
                <div className="text-xs text-white/80">answers</div>
              </div>
            </div>
          </div>

          {/* Answer Buttons Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
            {currentQuestion.options.map((option, index) => (
              <AnswerButton
                key={index}
                answer={option.text}
                color={answerColors[index]}
                icon={answerColors[index]}
                selected={selectedAnswer === index}
                correct={option.isCorrect}
                showResult={showResult}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null || showResult}
                index={index}
              />
            ))}
          </div>

          {/* Result Message */}
          {showResult && (
            <div className="flex justify-center">
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl animate-bounce-in max-w-md">
                <CardContent className="p-6 text-center">
                  {(() => {
                    const correctAnswerIndex = currentQuestion.options.findIndex(option => option.isCorrect);
                    const isCorrect = selectedAnswer === correctAnswerIndex;
                    const correctAnswerText = currentQuestion.options[correctAnswerIndex]?.text;
                    
                    return isCorrect ? (
                      <div className="text-green-600">
                        <div className="text-5xl mb-3 animate-bounce">🎉</div>
                        <h3 className="text-3xl font-bold mb-3 text-[#1BC47D]">Correct!</h3>
                        <div className="space-y-2">
                          <p className="text-lg text-gray-700">Calculating points based on speed...</p>
                          {streak > 1 && (
                            <p className="text-orange-600 font-bold">
                              🔥 {streak} Answer Streak! +{Math.floor(streak * 10)}% bonus
                            </p>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Response time: {((Date.now() - questionStartTime) / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        <div className="text-5xl mb-3">😔</div>
                        <h3 className="text-3xl font-bold mb-3 text-[#E21B3C]">
                          {selectedAnswer === -1 ? 'Time\'s up!' : 'Incorrect!'}
                        </h3>
                        <p className="text-lg text-gray-700">
                          Correct answer: <span className="font-semibold">{correctAnswerText}</span>
                        </p>
                        {streak > 0 && (
                          <p className="text-orange-600 text-sm mt-2">
                            Streak broken! You had {streak} correct answers.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}