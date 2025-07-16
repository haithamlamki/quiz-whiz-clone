import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
}

interface LeaderboardProps {
  players: Player[];
  currentQuestionNumber?: number;
  totalQuestions?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  currentQuestionNumber,
  totalQuestions
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPositionColors = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default:
        return "bg-card/50 border-border/50";
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Leaderboard
        </CardTitle>
        {currentQuestionNumber && totalQuestions && (
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionNumber} of {totalQuestions}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getPositionColors(index + 1)} transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getPositionIcon(index + 1)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{player.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {player.correctAnswers} correct answers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {player.score.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>
        ))}
        {sortedPlayers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No players yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};