import React, { useEffect } from 'react';

interface SoundEffectsProps {
  trigger: 'correct' | 'incorrect' | 'timeup' | 'countdown' | null;
  onComplete?: () => void;
}

export const SoundEffects: React.FC<SoundEffectsProps> = ({ trigger, onComplete }) => {
  useEffect(() => {
    if (!trigger) return;

    // Create audio context for sound generation
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    switch (trigger) {
      case 'correct':
        // Happy ascending notes
        playSound(523, 0.15); // C
        setTimeout(() => playSound(659, 0.15), 100); // E
        setTimeout(() => playSound(784, 0.3), 200); // G
        break;
        
      case 'incorrect':
        // Descending sad notes
        playSound(400, 0.2, 'sawtooth');
        setTimeout(() => playSound(300, 0.3, 'sawtooth'), 150);
        break;
        
      case 'timeup':
        // Urgent buzzer
        playSound(200, 0.5, 'square');
        break;
        
      case 'countdown':
        // Tick sound
        playSound(800, 0.1, 'square');
        break;
    }
    
    if (onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [trigger, onComplete]);

  return null;
};