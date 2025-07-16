import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function JoinGame() {
  const navigate = useNavigate();
  const { pin } = useParams();
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async () => {
    if (!playerName.trim()) return;
    
    setIsJoining(true);
    // Simulate joining game
    setTimeout(() => {
      navigate(`/play/${pin}/${encodeURIComponent(playerName)}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Join Game</h1>
            <div className="text-6xl font-black text-white/80 mb-4">
              PIN: {pin}
            </div>
          </div>

          {/* Join Form */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Gamepad2 className="h-6 w-6 text-primary" />
                Enter Your Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-center text-lg font-semibold h-12"
                  maxLength={20}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                />
              </div>

              <div className="space-y-3">
                <Button 
                  variant="game" 
                  size="hero" 
                  className="w-full"
                  onClick={handleJoinGame}
                  disabled={!playerName.trim() || isJoining}
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Join Game
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="mt-6 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Game: General Knowledge Quiz</h3>
                <p className="text-sm text-muted-foreground">
                  15 questions • Mixed topics • 20 seconds per question
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>12 players waiting</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}