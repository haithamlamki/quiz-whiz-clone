import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Logo from '@/components/Logo';
import { Users, Play, SkipForward, Trophy, Clock, Eye } from 'lucide-react';
import { useQuizBackground } from '@/contexts/QuizBackgroundContext';

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
  const { quizId } = useParams();
  const pin = '123456'; // This would come from the quiz data
  const navigate = useNavigate();
  const { getBackgroundStyle, resetBackground, setQuizBackground } = useQuizBackground();
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'results' | 'leaderboard'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [players, setPlayers] = useState(samplePlayers);
  const [quiz, setQuiz] = useState<any>(null);

  // Load quiz data and set background
  useEffect(() => {
    if (quizId) {
      const savedQuizData = localStorage.getItem(`quiz_${quizId}`);
      if (savedQuizData) {
        const quizData = JSON.parse(savedQuizData);
        setQuiz(quizData);
        
        // Set background based on quiz data
        if (quizData.customBackground) {
          setQuizBackground('custom', quizData.customBackground);
        }
      }
    }
  }, [quizId, setQuizBackground]);

  // Reset background when leaving this page
  useEffect(() => {
    return () => resetBackground();
  }, [resetBackground]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex] || sampleQuiz.questions[currentQuestionIndex];
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
    const totalQuestions = quiz?.questions?.length || sampleQuiz.questions.length;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setGameState('question');
      const nextQ = quiz?.questions?.[currentQuestionIndex + 1] || sampleQuiz.questions[currentQuestionIndex + 1];
      setTimeLeft(nextQ.timeLimit);
      // Reset answered status
      setPlayers(prev => prev.map(p => ({ ...p, answered: false })));
    } else {
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

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen" style={getBackgroundStyle()}>
        {/* Logo */}
        <div className="absolute top-4 left-4 z-10">
          <Logo size="md" />
        </div>
        
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-primary/80 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Title */}
              <div className="flex items-center gap-3 pl-20">
                <h1 className="text-2xl font-bold text-white">{quiz?.title || 'Abraj Quiz'}</h1>
              </div>
              
              {/* Game PIN */}
              <div className="text-center">
                <p className="text-white/80 text-sm">Game PIN</p>
                <p className="text-3xl font-bold text-white">{quiz?.pin || pin}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/create')}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold transition-colors"
                >
                  Manage Questions
                </button>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold transition-colors"
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
          {/* QR Code and Game PIN Section */}
          <div className="text-center mb-8">
            {/* QR Code Placeholder */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6 inline-block">
              <div className="w-48 h-48 bg-black rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xs grid grid-cols-8 gap-1">
                  {Array.from({ length: 64 }, (_, i) => (
                    <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`} />
                  ))}
                </div>
              </div>
              <p className="text-cyan-500 font-semibold">Scan QR to join</p>
            </div>

            {/* Game PIN */}
            <div className="bg-primary text-white px-8 py-4 rounded-lg text-4xl font-bold mb-4 inline-block shadow-lg">
              {quiz?.pin || pin}
            </div>

            {/* Copy Join Link Button */}
            <button 
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/join/${quiz?.pin || pin}`)}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 font-semibold transition-colors block mx-auto mb-8"
            >
              Copy Join Link
            </button>

            {/* Waiting Text */}
            <h2 className="text-2xl font-bold text-white mb-8">Waiting for players to join</h2>
          </div>

          {/* Connected Players Section */}
          <div className="bg-gray-800/80 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-cyan-400 text-lg font-semibold mb-4">Connected Players:</h3>
            <div className="flex flex-wrap gap-3">
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {player.name}
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-gray-400">No players connected yet...</p>
              )}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startGame}
            disabled={players.length === 0}
            className="bg-cyan-500 text-white px-12 py-4 rounded-lg text-xl font-bold hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors mt-8"
          >
            Start
          </button>
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
                      Question {currentQuestionIndex + 1} of {quiz?.questions?.length || sampleQuiz.questions.length}
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