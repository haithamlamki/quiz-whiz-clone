import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface TimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  isActive: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  onComplete,
  isActive,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isActive, onComplete]);

  const progress = ((duration - timeLeft) / duration) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">Time Remaining</span>
        <span className={cn(
          "text-2xl font-bold transition-colors",
          isUrgent ? "text-destructive animate-pulse" : "text-foreground"
        )}>
          {timeLeft}s
        </span>
      </div>
      <Progress 
        value={progress} 
        className={cn(
          "h-3 transition-all duration-500",
          isUrgent && "animate-pulse"
        )}
      />
    </div>
  );
};