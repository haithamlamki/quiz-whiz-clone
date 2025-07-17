import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GameCard } from '@/components/GameCard';
import Logo from '@/components/Logo';
import { Play, Plus, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Sample quiz data
const sampleQuizzes = [{
  id: '1',
  title: 'General Knowledge',
  description: 'Test your knowledge across various topics',
  playerCount: 156,
  duration: '8 min'
}, {
  id: '2',
  title: 'Science Quiz',
  description: 'Explore the wonders of science',
  playerCount: 89,
  duration: '10 min'
}, {
  id: '3',
  title: 'History Challenge',
  description: 'Journey through time and test your historical knowledge',
  playerCount: 234,
  duration: '12 min'
}];
export default function Home() {
  const navigate = useNavigate();
  const [gamePin, setGamePin] = React.useState('');
  const handleJoinGame = () => {
    if (gamePin.trim()) {
      navigate(`/join/${gamePin}`);
    }
  };
  const handleCreateQuiz = () => {
    navigate('/create');
  };
  const handlePlayQuiz = (quizId: string) => {
    navigate(`/host/${quizId}`);
  };
  return <div className="min-h-screen bg-gradient-game">
      <div className="container mx-auto px-4 py-8 rounded-none bg-gradient-game">
        {/* Logo */}
        <div className="absolute top-4 left-4">
          <Logo size="lg" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-6xl font-black text-white mb-4 animate-bounce-in">
            Abraj Quiz
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Create, play, and learn with interactive quizzes
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {/* Join Game Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-game border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Play className="h-6 w-6 text-primary" />
                Join Game
              </CardTitle>
              <CardDescription>
                Enter a game PIN to join an existing quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Game PIN" value={gamePin} onChange={e => setGamePin(e.target.value)} className="text-center text-xl font-bold h-12" maxLength={6} />
              <Button variant="game" size="hero" className="w-full" onClick={handleJoinGame} disabled={!gamePin.trim()}>
                <Users className="h-5 w-5" />
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Create Quiz Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-game border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Plus className="h-6 w-6 text-primary" />
                Create Quiz
              </CardTitle>
              <CardDescription>
                Design your own interactive quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="game" size="hero" className="w-full" onClick={handleCreateQuiz}>
                <Zap className="h-5 w-5" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Featured Quizzes */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Featured Quizzes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleQuizzes.map(quiz => <GameCard key={quiz.id} title={quiz.title} description={quiz.description} playerCount={quiz.playerCount} duration={quiz.duration} onPlay={() => handlePlayQuiz(quiz.id)} />)}
          </div>
        </div>
      </div>
    </div>;
}