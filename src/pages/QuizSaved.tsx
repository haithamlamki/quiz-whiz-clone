import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';
import { Copy, Share2, Play, Home, QrCode, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

interface SavedQuiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  backgroundTheme: string;
  customBackground?: string;
  pin: string;
}

export default function QuizSaved() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const loadQuizAndCreateGame = async () => {
      if (!quizId) return;

      try {
        // First try to fetch from Supabase
        const { data: supabaseQuiz, error: fetchError } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            questions (
              id,
              question_text,
              options,
              time_limit
            )
          `)
          .eq('id', quizId)
          .single();

        let quizData = null;
        
        if (supabaseQuiz && !fetchError) {
          // Quiz found in Supabase
          quizData = {
            id: supabaseQuiz.id,
            title: supabaseQuiz.title,
            description: supabaseQuiz.description,
            questions: supabaseQuiz.questions.map((q: any) => ({
              id: q.id,
              question: q.question_text,
              type: q.options?.type || 'multiple-choice',
              timeLimit: q.time_limit,
              points: q.options?.points || 1000,
              ...q.options
            })),
            backgroundTheme: 'classroom'
          };
        } else {
          // Fallback to localStorage for backward compatibility
          const savedQuizData = localStorage.getItem(`quiz_${quizId}`);
          if (savedQuizData) {
            quizData = JSON.parse(savedQuizData);
          }
        }

        if (!quizData) {
          console.error('Quiz not found in database or localStorage');
          return;
        }

        // Generate PIN and create game session in Supabase
        const { data: pinData } = await supabase.rpc('generate_game_pin');
        const gamePin = pinData;

        // Create game in Supabase
        const tempHostId = crypto.randomUUID();
        const { error: gameError } = await supabase
          .from('games')
          .insert({
            game_pin: gamePin,
            quiz_id: quizId,
            host_id: tempHostId,
            status: 'waiting'
          });

        if (gameError) {
          console.error('Error creating game:', gameError);
          throw new Error('Failed to create game session');
        }

        // Update quiz data with PIN
        const updatedQuiz = { ...quizData, pin: gamePin };
        setQuiz(updatedQuiz);

        // Store in localStorage for backward compatibility
        localStorage.setItem(`quiz_${quizId}`, JSON.stringify(updatedQuiz));
        localStorage.setItem(`pin_${gamePin}`, quizId);

        // Generate QR code
        const joinUrl = `${window.location.origin}/join/${gamePin}`;
        QRCode.toDataURL(joinUrl, { width: 200, margin: 2 })
          .then(url => setQrCodeUrl(url))
          .catch(err => console.error('Error generating QR code:', err));

      } catch (error) {
        console.error('Error loading quiz and creating game:', error);
        toast({
          title: "Error Loading Quiz",
          description: "Failed to load quiz data. Please try again.",
          variant: "destructive"
        });
      }
    };

    loadQuizAndCreateGame();
  }, [quizId, toast]);

  const copyPin = () => {
    if (quiz) {
      navigator.clipboard.writeText(quiz.pin);
      toast({
        title: "PIN Copied!",
        description: "Game PIN has been copied to clipboard.",
      });
    }
  };

  const copyJoinUrl = () => {
    if (quiz) {
      const joinUrl = `${window.location.origin}/join/${quiz.pin}`;
      navigator.clipboard.writeText(joinUrl);
      toast({
        title: "Join URL Copied!",
        description: "Join URL has been copied to clipboard.",
      });
    }
  };

  const startGame = () => {
    if (quiz) {
      navigate(`/host/${quiz.id}`);
    }
  };

  const getBackgroundStyle = () => {
    if (quiz?.customBackground) {
      return {
        backgroundImage: `url(${quiz.customBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return {};
  };

  if (!quiz) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{
          backgroundImage: 'var(--gradient-classroom)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <Card className="bg-white/95 backdrop-blur-sm shadow-game">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">The quiz you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      <div className="min-h-screen bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Logo */}
          <div className="absolute top-4 left-4">
            <Logo size="md" />
          </div>

          <div className="max-w-4xl mx-auto pt-16">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 animate-bounce-in">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Quiz Saved Successfully!</h1>
              <p className="text-xl text-white/90">Your quiz is ready to play</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Quiz Details */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-game">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Quiz Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <p className="text-muted-foreground">{quiz.description}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {quiz.questions.length} Questions
                    </Badge>
                    <Badge variant="secondary">
                      Background: {quiz.backgroundTheme === 'custom' ? 'Custom' : quiz.backgroundTheme}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Game PIN</p>
                          <p className="text-3xl font-bold text-primary">{quiz.pin}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={copyPin}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={copyJoinUrl} className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Join URL
                      </Button>
                      <Button onClick={startGame} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Start Game
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code */}
              <Card className="bg-white/95 backdrop-blur-sm shadow-game">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {qrCodeUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code for joining game" 
                        className="w-48 h-48 border rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Players can scan this QR code to join
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <Users className="h-4 w-4 inline mr-2" />
                      Players go to: <br />
                      <span className="font-mono text-xs">
                        {window.location.origin}/join/{quiz.pin}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Create Another Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}