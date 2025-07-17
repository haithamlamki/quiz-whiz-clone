import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <img 
      src="/lovable-uploads/ffed79a5-86e2-42f0-a4da-53648a4b3efb.png" 
      alt="Abraj Quiz Logo" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;