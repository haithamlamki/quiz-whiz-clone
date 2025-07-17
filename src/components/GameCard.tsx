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
    <Card className="group card-interactive hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/30 animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{playerCount} players</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="cta" size="cta" className="flex-1" onClick={onPlay}>
            <Trophy className="h-5 w-5" />
            Play Now
          </Button>
          {onEdit && (
            <Button variant="cta-outline" size="default" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};