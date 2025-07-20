import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  title?: string;
  message?: string;
}

export function Loader({ 
  title = "Loading...", 
  message = "Please wait while we load your data" 
}: LoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      backgroundImage: 'var(--gradient-classroom)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}