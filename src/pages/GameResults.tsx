import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaderboard } from '@/components/Leaderboard';
import Logo from '@/components/Logo';
import { Trophy, Users } from 'lucide-react';

// Sample leaderboard data
const samplePlayers = [
  { id: '1', name: 'Alex', score: 2800, correctAnswers: 3 },
  { id: '2', name: 'Sarah', score: 2400, correctAnswers: 2 },
  { id: '3', name: 'Mike', score: 2100, correctAnswers: 2 },
  { id: '4', name: 'Emma', score: 1600, correctAnswers: 1 },
  { id: '5', name: 'Current Player', score: 0, correctAnswers: 0 },
];

export default function GameResults() {
  const { pin, playerName, score } = useParams();
  const navigate = useNavigate();
  
  const finalScore = parseInt(score || '0');
  const decodedPlayerName = decodeURIComponent(playerName || '');
  
  // Update current player's score in the leaderboard
  const playersWithScore = samplePlayers.map(player => 
    player.name === 'Current Player' 
      ? { ...player, name: decodedPlayerName, score: finalScore, correctAnswers: Math.floor(finalScore / 1000) }
      : player
  );

  const currentPlayerRank = playersWithScore
    .sort((a, b) => b.score - a.score)
    .findIndex(p => p.name === decodedPlayerName) + 1;

  const getPerformanceMessage = () => {
    if (currentPlayerRank === 1) return "🏆 Amazing! You're the champion!";
    if (currentPlayerRank <= 3) return "🥉 Great job! You made it to the podium!";
    if (finalScore > 2000) return "🎯 Excellent performance!";
    if (finalScore > 1000) return "👍 Good job!";
    return "💪 Keep practicing, you'll do better next time!";
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Kahoot Quiz Results',
        text: `I scored ${finalScore.toLocaleString()} points and ranked #${currentPlayerRank} in the quiz!`,
        url: window.location.href
      });
    }
  };

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="absolute top-4 left-4">
            <Logo size="md" />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-4xl font-bold text-white mb-4">Game Complete!</h1>
            <div className="text-white/80">PIN: {pin}</div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Player Results */}
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-game">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Your Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Hello</div>
                    <div className="text-2xl font-bold">{decodedPlayerName}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Final Score</div>
                    <div className="text-4xl font-black text-primary">
                      {finalScore.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Your Rank</div>
                    <div className="text-3xl font-bold text-yellow-600">
                      #{currentPlayerRank}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-lg font-semibold">
                      {getPerformanceMessage()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/95 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Button 
                    variant="game" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    <Users className="h-5 w-5" />
                    Join New Game
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard */}
            <div>
              <Leaderboard 
                players={playersWithScore}
                currentQuestionNumber={3}
                totalQuestions={3}
              />
            </div>
          </div>

          {/* Quiz Summary */}
          <Card className="mt-8 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quiz Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">3</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(finalScore / 1000)}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(((Math.floor(finalScore / 1000)) / 3) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">5</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}