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
    <div className="min-h-screen" style={{
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 800\'%3E%3Cdefs%3E%3ClinearGradient id=\'classroom\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' style=\'stop-color:%23a8d5ba;stop-opacity:1\' /%3E%3Cstop offset=\'50%25\' style=\'stop-color:%2398c7a8;stop-opacity:1\' /%3E%3Cstop offset=\'100%25\' style=\'stop-color:%2385c7a1;stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23classroom)\'/%3E%3C/svg%3E")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-cyan-500 font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Abraj Quiz</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Classroom Blackboard Area */}
        <div className="relative w-full max-w-3xl">
          {/* Blackboard */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl mb-8">
            <div className="flex items-center justify-center h-32">
              {gameStarted ? (
                <div className="text-white">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-xl">Starting game...</p>
                </div>
              ) : (
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                </div>
              )}
            </div>
          </div>

          {/* Waiting Text */}
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {gameStarted ? 'Starting game...' : 'Waiting for the players'}
          </h2>
        </div>

        {/* Player Name Display */}
        <div className="fixed bottom-4 left-4 bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold">
          {playerName}
        </div>

        {/* Score Display */}
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xl">
          0
        </div>
      </div>
    </div>
  );
}