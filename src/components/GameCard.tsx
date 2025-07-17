import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, Clock, Trophy } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  playerCount?: number;
  duration?: string;
  onPlay: () => void;
  onEdit?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  playerCount = 0,
  duration = "5 min",
  onPlay,
  onEdit
}) => {
  return (
    <Card className="group hover:shadow-game transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-3d">{title}</CardTitle>
        <CardDescription className="text-muted-foreground text-3d text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-base text-muted-foreground text-3d">
          <div className="flex items-center gap-1">
            <Users className="h-5 w-5" />
            <span>{playerCount} players</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-5 w-5" />
            <span>{duration}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="game" size="sm" className="flex-1" onClick={onPlay}>
            <Trophy className="h-4 w-4" />
            Play
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};