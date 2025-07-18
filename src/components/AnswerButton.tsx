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
  index?: number; // For cascade animation
}

const colorIcons = {
  red: '▲',     // Triangle
  blue: '♦',    // Diamond  
  yellow: '●',  // Circle
  green: '■'    // Square
};

const colorStyles = {
  red: {
    backgroundColor: '#E21B3C',
    hoverColor: '#F02347',
    shadowColor: 'rgba(226, 27, 60, 0.4)'
  },
  blue: {
    backgroundColor: '#1368CE',
    hoverColor: '#1B7AE0',
    shadowColor: 'rgba(19, 104, 206, 0.4)'
  },
  yellow: {
    backgroundColor: '#FFD300',
    hoverColor: '#FFE033',
    shadowColor: 'rgba(255, 211, 0, 0.4)'
  },
  green: {
    backgroundColor: '#26890C',
    hoverColor: '#2E9F0E',
    shadowColor: 'rgba(38, 137, 12, 0.4)'
  }
};

export const AnswerButton: React.FC<AnswerButtonProps> = ({
  answer,
  color,
  icon,
  selected,
  correct,
  showResult,
  onClick,
  disabled = false,
  index = 0
}) => {
  const [isClicked, setIsClicked] = React.useState(false);
  const colorStyle = colorStyles[color];

  const handleClick = () => {
    if (disabled) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick();
  };

  // Base styles for the button
  const baseStyles: React.CSSProperties = {
    backgroundColor: colorStyle.backgroundColor,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    boxShadow: `0 4px 8px ${colorStyle.shadowColor}`,
    animationDelay: `${index * 150}ms`,
    transform: selected && !showResult ? 'scale(1.02)' : 
               isClicked ? 'scale(0.95)' : 
               showResult && !correct && selected ? 'scale(1)' : 'scale(1)',
    opacity: showResult && !correct && selected ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  // Hover styles
  const hoverStyles: React.CSSProperties = {
    backgroundColor: colorStyle.hoverColor,
    transform: !disabled && !showResult ? 'scale(1.05)' : 'scale(1)',
    boxShadow: `0 6px 12px ${colorStyle.shadowColor}`
  };

  // Result styles
  if (showResult && correct) {
    baseStyles.backgroundColor = '#1BC47D';
    baseStyles.animation = 'pulse-correct 0.4s ease-in-out';
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled && !showResult) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !showResult) {
          Object.assign(e.currentTarget.style, {
            backgroundColor: colorStyle.backgroundColor,
            transform: selected ? 'scale(1.02)' : 'scale(1)',
            boxShadow: `0 4px 8px ${colorStyle.shadowColor}`
          });
        }
      }}
      className={cn(
        "relative flex items-center justify-start gap-4 p-4 w-full h-16 text-left",
        "font-bold text-base transition-all duration-200",
        "animate-slide-up-cascade",
        selected && !showResult && "animate-selection-pulse",
        showResult && correct && "animate-correct-flash",
        disabled && "cursor-not-allowed"
      )}
    >
      {/* Icon */}
      <div className="text-2xl font-black flex-shrink-0 w-8 flex items-center justify-center">
        {colorIcons[color]}
      </div>
      
      {/* Answer text */}
      <span className="flex-1 leading-tight">
        {answer}
      </span>
      
      {/* Correct indicator */}
      {showResult && correct && (
        <div className="text-2xl animate-bounce-in text-white">
          ✓
        </div>
      )}
      
      {/* Selection pulse effect */}
      {selected && !showResult && (
        <div 
          className="absolute inset-0 rounded-md animate-pulse-selection pointer-events-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            animation: 'pulse-selection 0.3s ease-in-out'
          }}
        />
      )}
    </button>
  );
};