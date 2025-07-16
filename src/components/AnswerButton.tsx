import React from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface AnswerButtonProps {
  answer: string;
  color: 'red' | 'blue' | 'yellow' | 'green';
  icon: string;
  selected?: boolean;
  correct?: boolean;
  showResult?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const colorIcons = {
  red: '△',
  blue: '◆',
  yellow: '◯',
  green: '□'
};

export const AnswerButton: React.FC<AnswerButtonProps> = ({
  answer,
  color,
  icon,
  selected,
  correct,
  showResult,
  onClick,
  disabled = false
}) => {
  const getVariant = (): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "game" | "answer-red" | "answer-blue" | "answer-yellow" | "answer-green" => {
    if (showResult) {
      if (correct) return `answer-${color}` as const;
      if (selected && !correct) return 'destructive';
      return 'secondary';
    }
    return selected ? (`answer-${color}` as const) : 'outline';
  };

  return (
    <Button
      variant={getVariant()}
      size="answer"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-4 text-center transition-all duration-300",
        selected && !showResult && "animate-pulse-answer",
        showResult && correct && "animate-celebrate",
        "hover:scale-105 active:scale-95"
      )}
    >
      <div className="text-2xl font-black">
        {colorIcons[color]}
      </div>
      <span className="text-sm sm:text-base font-semibold leading-tight">
        {answer}
      </span>
      {showResult && correct && (
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce-in">
          ✓
        </div>
      )}
    </Button>
  );
};