import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorCard({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  onGoHome 
}: ErrorCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      backgroundImage: 'var(--gradient-classroom)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            {onGoHome && (
              <Button onClick={onGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}