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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
            time_limit: q.time_limit || 20,
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
        setCurrentQuestionIndex(gameData.current_question_index >= 0 ? gameData.current_question_index : 0);
        
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

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!game?.id) return;

    const gameChannel = supabase
      .channel(`game-play-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`
        },
        (payload) => {
          const updatedGame = payload.new as Game;
          console.log('Game state updated:', updatedGame);
          setGame(updatedGame);
          
          // Handle game state changes
          if (updatedGame.status === 'playing' && gameState === 'waiting') {
            setGameState('question');
            setQuestionStartTime(Date.now());
          } else if (updatedGame.status === 'finished') {
            navigate(`/final-results/${pin}`);
          }
          
          // Handle question changes
          if (updatedGame.current_question_index !== currentQuestionIndex && updatedGame.current_question_index >= 0) {
            console.log('Question index changed to:', updatedGame.current_question_index);
            setCurrentQuestionIndex(updatedGame.current_question_index);
            setSelectedAnswer(null);
            setShowResult(false);
            setGameState('question');
            setQuestionStartTime(Date.now());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [game?.id, gameState, currentQuestionIndex, pin, navigate]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion = quiz ? currentQuestionIndex === quiz.questions.length - 1 : false;

  useEffect(() => {
    if (gameState === 'question') {
      setQuestionStartTime(Date.now());
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
    const basePoints = 1000; // Default points per question
    
    // Calculate score with speed bonus and streak multiplier
    if (isCorrect) {
      const responseTime = Date.now() - questionStartTime;
      const speedBonus = Math.max(0, currentQuestion.time_limit * 1000 - responseTime) / 100;
      const streakMultiplier = 1 + (streak * 0.1);
      const questionScore = Math.floor((basePoints + speedBonus) * streakMultiplier);
      
      const newScore = score + questionScore;
      setScore(newScore);
      setStreak(prev => prev + 1);
      setTotalCorrect(prev => prev + 1);
      setSoundTrigger('correct');
      
      // Update player score in database
      if (player) {
        await supabase
          .from('players')
          .update({ score: newScore })
          .eq('id', player.id);
      }
    } else {
      setStreak(0);
      setSoundTrigger('incorrect');
    }

    // Record the answer
    if (player && currentQuestion) {
      await supabase
        .from('answers')
        .insert({
          player_id: player.id,
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          score_awarded: isCorrect ? basePoints : 0,
          time_taken_ms: Date.now() - questionStartTime
        });
    }

    // Wait for host to control question flow - no auto advance
    // The game will advance when the host clicks "Next Question" and updates the database
  };

  const answerColors: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'blue', 'yellow', 'green'];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen" style={getBackgroundStyle()}>
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
      <div className="min-h-screen" style={getBackgroundStyle()}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-2xl font-bold mb-2">Game Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/')} variant="outline">
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
      <div className="min-h-screen" style={getBackgroundStyle()}>
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

  // Safety check - if no current question, show error state
  if (!currentQuestion) {
    return (
      <div className="min-h-screen" style={getBackgroundStyle()}>
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

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{quiz?.title}</h1>
            <div className="flex items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>PIN: {pin}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>{score.toLocaleString()} points</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full">
                  <span className="text-orange-300">🔥</span>
                  <span>{streak} streak</span>
                </div>
              )}
            </div>
          </div>

          {/* Question Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-white/80 text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {quiz?.questions.length || 0}</span>
              <span>1000 points</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="mb-8">
            <Timer
              duration={currentQuestion.time_limit}
              onComplete={handleTimeUp}
              isActive={gameState === 'question' && !showResult}
              className="bg-white/10 backdrop-blur-sm p-4 rounded-xl"
            />
          </div>

          {/* Question */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Answers */}
          <div className="grid grid-cols-2 gap-4 mb-8">
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
              />
            ))}
          </div>

          {/* Result Message */}
          {showResult && (
            <Card className="bg-white/95 backdrop-blur-sm shadow-game animate-bounce-in">
              <CardContent className="p-6 text-center">
                {(() => {
                  const correctAnswerIndex = currentQuestion.options.findIndex(option => option.isCorrect);
                  const isCorrect = selectedAnswer === correctAnswerIndex;
                  const correctAnswerText = currentQuestion.options[correctAnswerIndex]?.text;
                  
                  return isCorrect ? (
                    <div className="text-green-600">
                      <div className="text-4xl mb-2">🎉</div>
                      <h3 className="text-2xl font-bold mb-2">Correct!</h3>
                      <div className="space-y-2">
                        <p className="text-lg">+1000 points</p>
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
                      <div className="text-4xl mb-2">😔</div>
                      <h3 className="text-2xl font-bold mb-2">
                        {selectedAnswer === -1 ? 'Time\'s up!' : 'Incorrect!'}
                      </h3>
                      <p className="text-lg">
                        Correct answer: {correctAnswerText}
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
          )}
        </div>
      </div>
    </div>
  );
}