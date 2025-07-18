import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Users, ArrowLeft, Gamepad2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function JoinGame() {
  const navigate = useNavigate();
  const { pin } = useParams();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [quizInfo, setQuizInfo] = useState<any>(null);

  // Load game info when component mounts
  useEffect(() => {
    const loadGameInfo = async () => {
      if (!pin) return;
      
      try {
        // Check if game exists
        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('id, quiz_id, status')
          .eq('game_pin', pin)
          .single();

        if (gameError || !game) {
          console.error('Game not found:', gameError);
          return;
        }

        setGameInfo(game);

        // Load quiz info
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('title, description')
          .eq('id', game.quiz_id)
          .single();

        if (quiz) {
          setQuizInfo(quiz);
        }

        // Load questions count
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', game.quiz_id);

        if (quiz && count !== null) {
          setQuizInfo({ ...quiz, questionsCount: count });
        }
      } catch (error) {
        console.error('Error loading game info:', error);
      }
    };

    loadGameInfo();
  }, [pin]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) return;
    
    setIsJoining(true);
    
    try {
      // Call the add_player_to_game function
      const { data, error } = await supabase.rpc('add_player_to_game', {
        p_game_pin: pin,
        p_player_name: playerName.trim()
      });

      if (error) {
        console.error('Error joining game:', error);
        toast({
          title: "Error",
          description: "Failed to join game. Please try again.",
          variant: "destructive"
        });
        setIsJoining(false);
        return;
      }

      const result = data[0];
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
        setIsJoining(false);
        return;
      }

      toast({
        title: "Success!",
        description: "Joined game successfully!",
      });

      // Redirect to lobby
      setTimeout(() => {
        navigate(`/lobby/${pin}/${encodeURIComponent(playerName)}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: "Error",
        description: "Failed to join game. Please try again.",
        variant: "destructive"
      });
      setIsJoining(false);
    }
  };

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
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="absolute top-4 left-4">
            <Logo size="md" />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Join Game</h1>
            <div className="text-6xl font-black text-white/80 mb-4">
              PIN: {pin}
            </div>
          </div>

          {/* Join Form */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Gamepad2 className="h-6 w-6 text-primary" />
                Enter Your Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-center text-lg font-semibold h-12"
                  maxLength={20}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                />
              </div>

              <div className="space-y-3">
                <Button 
                  variant="game" 
                  size="hero" 
                  className="w-full"
                  onClick={handleJoinGame}
                  disabled={!playerName.trim() || isJoining}
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5" />
                      Join Game
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="mt-6 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                {gameInfo ? (
                  <>
                    <h3 className="font-semibold">
                      Game: {quizInfo?.title || 'Quiz Game'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {quizInfo?.questionsCount || 0} questions • Mixed topics • Timed questions
                    </p>
                    {quizInfo?.description && (
                      <p className="text-xs text-muted-foreground">
                        {quizInfo.description}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">Loading game info...</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we fetch game details
                    </p>
                  </>
                )}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Waiting for players...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}