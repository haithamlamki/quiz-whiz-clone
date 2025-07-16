import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Play, SkipForward, Trophy, Clock, Eye } from 'lucide-react';

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

// Sample players data
const samplePlayers = [
  { id: '1', name: 'Player1', score: 2400, streak: 2, answered: true },
  { id: '2', name: 'Player2', score: 1800, streak: 1, answered: true },
  { id: '3', name: 'Player3', score: 1200, streak: 0, answered: false },
  { id: '4', name: 'Player4', score: 0, streak: 0, answered: false },
];

export default function HostDashboard() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'results' | 'leaderboard'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [players, setPlayers] = useState(samplePlayers);

  const currentQuestion = sampleQuiz.questions[currentQuestionIndex];
  const answeredCount = players.filter(p => p.answered).length;
  const answerProgress = (answeredCount / players.length) * 100;

  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('question');
    setTimeLeft(currentQuestion.timeLimit);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < sampleQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setGameState('question');
      setTimeLeft(sampleQuiz.questions[currentQuestionIndex + 1].timeLimit);
      // Reset answered status
      setPlayers(prev => prev.map(p => ({ ...p, answered: false })));
    } else {
      navigate(`/final-results/${pin}`);
    }
  };

  const showResults = () => {
    setGameState('results');
  };

  const showLeaderboard = () => {
    setGameState('leaderboard');
  };

  const answerColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-game">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Game PIN Display */}
            <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-8">
                <h1 className="text-4xl font-bold mb-4">Game PIN</h1>
                <div className="text-8xl font-black text-primary mb-4">{pin}</div>
                <p className="text-xl text-muted-foreground">
                  Players can join at kahoot.it with this PIN
                </p>
              </CardContent>
            </Card>

            {/* Quiz Info */}
            <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
              <CardHeader>
                <CardTitle className="text-2xl">{sampleQuiz.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-8 text-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{sampleQuiz.questions.length} Questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{players.length} Players</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Players List */}
            <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
              <CardHeader>
                <CardTitle>Players in Lobby</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((player) => (
                    <div key={player.id} className="p-3 bg-muted rounded-lg">
                      <div className="font-semibold">{player.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Start Game Button */}
            <Button 
              variant="game" 
              size="hero" 
              onClick={startGame}
              disabled={players.length === 0}
            >
              <Play className="h-6 w-6" />
              Start Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'question') {
    return (
      <div className="min-h-screen bg-gradient-game">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Host Controls */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      Question {currentQuestionIndex + 1} of {sampleQuiz.questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-2xl font-bold text-primary">{timeLeft}s</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={showResults}>
                      <Eye className="h-4 w-4" />
                      Show Results
                    </Button>
                    <Button variant="outline" onClick={nextQuestion}>
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
                  {currentQuestion.answers.map((answer, index) => (
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

            {/* Live Player Stats */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-game">
              <CardHeader>
                <CardTitle>Live Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((player) => (
                    <div 
                      key={player.id} 
                      className={`p-3 rounded-lg border-2 ${
                        player.answered ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.answered ? '✓ Answered' : 'Thinking...'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-game">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Results */}
            <Card className="mb-6 bg-white/95 backdrop-blur-sm shadow-game">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold mb-8">{currentQuestion.question}</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {currentQuestion.answers.map((answer, index) => (
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
                  <Button variant="outline" onClick={showLeaderboard}>
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