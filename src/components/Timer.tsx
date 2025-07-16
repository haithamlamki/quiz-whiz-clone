import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { SoundEffects } from './SoundEffects';

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
  const [soundTrigger, setSoundTrigger] = useState<'countdown' | 'timeup' | null>(null);

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
          setSoundTrigger('timeup');
          onComplete();
          return 0;
        }
        if (prev <= 5) {
          setSoundTrigger('countdown');
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
      <SoundEffects 
        trigger={soundTrigger} 
        onComplete={() => setSoundTrigger(null)} 
      />
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