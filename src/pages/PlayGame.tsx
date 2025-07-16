import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnswerButton } from '@/components/AnswerButton';
import { Timer } from '@/components/Timer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock } from 'lucide-react';

// Sample quiz data
const sampleQuiz = {
  id: '1',
  title: 'General Knowledge Quiz',
  questions: [
    {
      id: '1',
      question: 'What is the capital of France?',
      answers: ['London', 'Berlin', 'Paris', 'Madrid'],
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

export default function PlayGame() {
  const { pin, playerName } = useParams();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'question' | 'result' | 'finished'>('waiting');
  const [timeBonus, setTimeBonus] = useState(0);

  const currentQuestion = sampleQuiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === sampleQuiz.questions.length - 1;

  useEffect(() => {
    // Simulate game start
    const timer = setTimeout(() => {
      setGameState('question');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      setSelectedAnswer(-1); // No answer selected
    }
    showQuestionResult();
  };

  const showQuestionResult = () => {
    setShowResult(true);
    setGameState('result');
    
    // Calculate score
    if (selectedAnswer === currentQuestion.correctAnswer) {
      const timeBasedScore = Math.max(100, currentQuestion.points - (timeBonus * 50));
      setScore(prev => prev + timeBasedScore);
    }

    // Auto advance after 3 seconds
    setTimeout(() => {
      if (isLastQuestion) {
        setGameState('finished');
        navigate(`/results/${pin}/${encodeURIComponent(playerName || '')}/${score}`);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeBonus(0);
        setGameState('question');
      }
    }, 3000);
  };

  const answerColors: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'blue', 'yellow', 'green'];

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center">
        <Card className="bg-white/95 backdrop-blur-sm shadow-game">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse text-4xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">Get Ready!</h2>
            <p className="text-muted-foreground mb-4">The game is about to start...</p>
            <div className="text-lg font-semibold">Welcome, {decodeURIComponent(playerName || '')}!</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{sampleQuiz.title}</h1>
            <div className="flex items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>PIN: {pin}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>{score.toLocaleString()} points</span>
              </div>
            </div>
          </div>

          {/* Question Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-white/80 text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {sampleQuiz.questions.length}</span>
              <span>{currentQuestion.points} points</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${((currentQuestionIndex + 1) / sampleQuiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="mb-8">
            <Timer
              duration={currentQuestion.timeLimit}
              onComplete={handleTimeUp}
              isActive={gameState === 'question' && !showResult}
              className="bg-white/10 backdrop-blur-sm p-4 rounded-xl"
            />
          </div>

          {/* Question */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Answers */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {currentQuestion.answers.map((answer, index) => (
              <AnswerButton
                key={index}
                answer={answer}
                color={answerColors[index]}
                icon={answerColors[index]}
                selected={selectedAnswer === index}
                correct={index === currentQuestion.correctAnswer}
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
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div className="text-green-600">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="text-2xl font-bold mb-2">Correct!</h3>
                    <p className="text-lg">+{currentQuestion.points} points</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="text-4xl mb-2">😔</div>
                    <h3 className="text-2xl font-bold mb-2">
                      {selectedAnswer === -1 ? 'Time\'s up!' : 'Incorrect!'}
                    </h3>
                    <p className="text-lg">
                      Correct answer: {currentQuestion.answers[currentQuestion.correctAnswer]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}