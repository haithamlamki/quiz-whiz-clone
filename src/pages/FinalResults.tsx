import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Home, RotateCcw } from 'lucide-react';

// Sample final results data
const finalResults = [
  { 
    rank: 1, 
    name: 'Player1', 
    score: 2850, 
    correctAnswers: 3, 
    streak: 3,
    avgTime: 12.3 
  },
  { 
    rank: 2, 
    name: 'Player2', 
    score: 2100, 
    correctAnswers: 2, 
    streak: 2,
    avgTime: 15.7 
  },
  { 
    rank: 3, 
    name: 'Player3', 
    score: 1200, 
    correctAnswers: 1, 
    streak: 1,
    avgTime: 18.2 
  },
  { 
    rank: 4, 
    name: 'Player4', 
    score: 800, 
    correctAnswers: 1, 
    streak: 0,
    avgTime: 19.8 
  },
];

export default function FinalResults() {
  const { pin } = useParams();
  const navigate = useNavigate();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-orange-600" />;
      default: return <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">Game Complete!</h1>
            <p className="text-xl text-white/80">
              Final Results for Game PIN: {pin}
            </p>
          </div>

          {/* Podium - Top 3 */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle className="text-center text-2xl">🏆 Top 3 Players 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {finalResults.slice(0, 3).map((player, index) => (
                  <div key={player.rank} className="text-center">
                    <div 
                      className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${getRankBg(player.rank)}`}
                    >
                      {getRankIcon(player.rank)}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{player.name}</h3>
                    <div className="text-2xl font-black text-primary mb-1">
                      {player.score.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {player.correctAnswers}/3 correct
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.streak} streak • {player.avgTime}s avg
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complete Leaderboard */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle>Complete Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {finalResults.map((player) => (
                  <div 
                    key={player.rank}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      player.rank <= 3 ? getRankBg(player.rank) + ' text-white' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(player.rank)}
                      <div>
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm opacity-80">
                          {player.correctAnswers}/3 correct • {player.streak} streak
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {player.score.toLocaleString()}
                      </div>
                      <div className="text-sm opacity-80">
                        {player.avgTime}s avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Stats */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{finalResults.length}</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">3</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(finalResults.reduce((acc, p) => acc + p.avgTime, 0) / finalResults.length)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Answer Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round((finalResults.reduce((acc, p) => acc + p.correctAnswers, 0) / (finalResults.length * 3)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
              Home
            </Button>
            <Button 
              variant="game" 
              size="lg"
              onClick={() => navigate('/create')}
            >
              <RotateCcw className="h-5 w-5" />
              Create New Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}