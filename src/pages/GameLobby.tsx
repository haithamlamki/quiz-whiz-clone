import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, Activity, Clock, Trophy } from 'lucide-react';

export default function GameLobby() {
  const { pin, playerName: urlPlayerName } = useParams();
  const navigate = useNavigate();
  const playerName = decodeURIComponent(urlPlayerName || '');
  const [isJoined, setIsJoined] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Simulate other players joining with animations
  useEffect(() => {
    const playerNames = ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Maya'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < playerNames.length && Math.random() > 0.3) {
        setPlayers(prev => [...prev, playerNames[currentIndex]]);
        currentIndex++;
      }
    }, Math.random() * 3000 + 1000); // Random interval between 1-4 seconds

    return () => clearInterval(interval);
  }, []);

  // Simulate game starting with countdown
  useEffect(() => {
    if (isJoined && playerName) {
      setPlayers(prev => [...prev.filter(p => p !== playerName), playerName]);
      
      const timer = setTimeout(() => {
        setGameStarted(true);
        // Start countdown
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
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isJoined, pin, playerName, navigate]);


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
                Players ({players.length + 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Current player */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-3 rounded-lg font-semibold text-center relative animate-pulse-glow">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {playerName} (You)
                  </div>
                </div>
                
                {/* Other players */}
                {players.map((player, index) => (
                  <div 
                    key={player} 
                    className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold text-center animate-slide-up"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {player}
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