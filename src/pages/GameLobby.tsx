import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useQuizBackground } from '@/contexts/QuizBackgroundContext';

export default function GameLobby() {
  const { pin, playerName: urlPlayerName } = useParams();
  const navigate = useNavigate();
  const { getBackgroundStyle, resetBackground } = useQuizBackground();
  const playerName = decodeURIComponent(urlPlayerName || '');
  const [isJoined, setIsJoined] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Reset background when leaving this page
  useEffect(() => {
    return () => resetBackground();
  }, [resetBackground]);

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
    <div className="min-h-screen" style={getBackgroundStyle()}>
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