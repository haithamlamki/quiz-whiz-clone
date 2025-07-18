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
    setSoundTrigger(null); // Reset sound trigger when duration changes
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setSoundTrigger('timeup');
          setTimeout(() => onComplete(), 100); // Small delay to ensure state updates
          return 0;
        }
        if (newTime <= 5 && newTime > 0) {
          setSoundTrigger('countdown');
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration, onComplete]); // Added duration to reset timer properly

  const progress = ((duration - timeLeft) / duration) * 100;
  const isUrgent = timeLeft <= 5;

  // If className contains 'text-' then we're being used as just a number display
  const isNumberOnly = className?.includes('text-');
  
  if (isNumberOnly) {
    return (
      <span className={cn(
        "transition-all duration-300",
        isUrgent && "animate-pulse",
        className
      )}>
        <SoundEffects 
          trigger={soundTrigger} 
          onComplete={() => setSoundTrigger(null)} 
        />
        {timeLeft}
      </span>
    );
  }

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