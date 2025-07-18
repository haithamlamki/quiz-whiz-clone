import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, QrCode, Share2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GamePinDisplayProps {
  pin: string;
  qrCodeUrl?: string;
  showCopyButton?: boolean;
  showShareButton?: boolean;
  animated?: boolean;
  className?: string;
}

export const GamePinDisplay: React.FC<GamePinDisplayProps> = ({
  pin,
  qrCodeUrl,
  showCopyButton = true,
  showShareButton = true,
  animated = true,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);

  const gameUrl = `${window.location.origin}/join/${pin}`;

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      toast({
        title: "PIN Copied!",
        description: "Game PIN has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the PIN manually",
        variant: "destructive",
      });
    }
  };

  const shareGame = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my quiz game!',
          text: `Use PIN: ${pin}`,
          url: gameUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(gameUrl);
        toast({
          title: "Link Copied!",
          description: "Join link has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to share",
          description: "Please copy the link manually",
          variant: "destructive",
        });
      }
    }
  };

  // Generate a simple QR code pattern (placeholder)
  const generateQRPattern = () => {
    return Array.from({ length: 100 }, (_, i) => {
      const row = Math.floor(i / 10);
      const col = i % 10;
      // Simple pattern based on PIN
      const hash = pin.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return (hash + row + col) % 3 === 0;
    });
  };

  const qrPattern = generateQRPattern();

  return (
    <Card className={`bg-white/95 backdrop-blur-sm shadow-xl ${className}`}>
      <CardContent className="p-8 text-center">
        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl shadow-inner mb-6 inline-block">
          <div className="w-48 h-48 bg-white rounded-lg relative overflow-hidden">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
            ) : (
              <div className="grid grid-cols-10 gap-0 w-full h-full">
                {qrPattern.map((filled, index) => (
                  <div
                    key={index}
                    className={`${filled ? 'bg-black' : 'bg-white'} transition-colors`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-primary">
            <QrCode className="h-4 w-4" />
            <span className="text-sm font-medium">Scan to join</span>
          </div>
        </div>

        {/* Game PIN */}
        <div 
          className={`bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-6 rounded-xl shadow-lg mb-6 inline-block ${
            animated ? 'animate-pulse' : ''
          }`}
        >
          <p className="text-sm opacity-90 mb-1">Game PIN</p>
          <p className="text-4xl font-bold tracking-wider font-mono">{pin}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          {showCopyButton && (
            <Button
              variant={copied ? "default" : "outline"}
              onClick={copyPin}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy PIN"}
            </Button>
          )}
          
          {showShareButton && (
            <Button
              variant="outline"
              onClick={shareGame}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Game
            </Button>
          )}
        </div>

        {/* Join Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">
            How to join:
          </p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>1. Scan the QR code with your phone</p>
            <p>2. Or visit the website and enter PIN: <strong>{pin}</strong></p>
            <p>3. Enter your name and get ready to play!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PinGeneratorProps {
  onPinGenerated: (pin: string) => void;
  length?: number;
}

export const PinGenerator: React.FC<PinGeneratorProps> = ({
  onPinGenerated,
  length = 6
}) => {
  const generatePin = () => {
    const pin = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    onPinGenerated(pin);
    return pin;
  };

  return (
    <Button variant="outline" onClick={generatePin} className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      Generate New PIN
    </Button>
  );
};