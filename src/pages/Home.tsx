import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NavigationBar } from '@/components/NavigationBar';
import { Play, Plus, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  return (
    <>
      {/* Navigation Bar */}
      <NavigationBar />
      
      {/* Main Content */}
      <div 
        className="min-h-screen" 
        style={{
          backgroundImage: 'var(--gradient-classroom)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 pt-8">
            <h1 className="text-hero font-extrabold tracking-tight text-white text-3d mb-6">
              Welcome to Abraj Quiz
            </h1>
            <p className="text-body-lg font-normal text-white/90 mb-8 max-w-2xl mx-auto">
              Create, play, and learn with interactive quizzes that make learning fun and engaging
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {/* Join Game Card */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-game border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-title font-semibold tracking-tight flex items-center justify-center gap-2">
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
                <CardTitle className="text-title font-semibold tracking-tight flex items-center justify-center gap-2">
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

        </div>
      </div>
    </>
  );
}