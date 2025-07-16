import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function GameLobby() {
  const { pin, playerName: urlPlayerName } = useParams();
  const navigate = useNavigate();
  const playerName = decodeURIComponent(urlPlayerName || '');
  const [isJoined, setIsJoined] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Simulate other players joining
  useEffect(() => {
    const playerNames = ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < playerNames.length) {
        setPlayers(prev => [...prev, playerNames[currentIndex]]);
        currentIndex++;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate game starting
  useEffect(() => {
    if (isJoined && playerName) {
      setPlayers(prev => [...prev.filter(p => p !== playerName), playerName]);
      const timer = setTimeout(() => {
        setGameStarted(true);
        navigate(`/play/${pin}/${encodeURIComponent(playerName)}`);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isJoined, pin, playerName, navigate]);


  return (
    <div className="min-h-screen bg-gradient-game">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Game Status */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🎮</div>
              <h1 className="text-4xl font-bold mb-4">You're in!</h1>
              <p className="text-xl text-muted-foreground mb-4">
                Game PIN: <span className="font-bold text-primary">{pin}</span>
              </p>
              <div className="text-lg">
                {gameStarted ? 'Starting game...' : 'Waiting for host to start the game...'}
              </div>
              {!gameStarted && (
                <div className="animate-pulse text-primary font-semibold mt-2">
                  Get ready! 🚀
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {players.map((player, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg font-semibold ${
                      player === playerName 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' 
                        : 'bg-muted'
                    } animate-bounce-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {player}
                    {player === playerName && (
                      <div className="text-xs opacity-80 mt-1">You</div>
                    )}
                  </div>
                ))}
              </div>
              
              {players.length === 0 && (
                <div className="text-muted-foreground py-8">
                  Waiting for players to join...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}