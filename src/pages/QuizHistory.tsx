import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';
import { Play, Copy, Share2, Trash2, Clock, Users, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedQuiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  backgroundTheme: string;
  customBackground?: string;
  pin: string;
  createdAt: string;
}

export default function QuizHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);

  useEffect(() => {
    // Load all quizzes from localStorage
    const loadQuizzes = () => {
      const allKeys = Object.keys(localStorage);
      const quizKeys = allKeys.filter(key => key.startsWith('quiz_'));
      
      const loadedQuizzes: SavedQuiz[] = [];
      quizKeys.forEach(key => {
        try {
          const quizData = localStorage.getItem(key);
          if (quizData) {
            const quiz = JSON.parse(quizData);
            loadedQuizzes.push(quiz);
          }
        } catch (error) {
          console.error('Error loading quiz:', key, error);
        }
      });
      
      // Sort by creation date (newest first)
      loadedQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setQuizzes(loadedQuizzes);
    };

    loadQuizzes();
  }, []);

  const deleteQuiz = (quizId: string, pin: string) => {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      // Remove quiz data
      localStorage.removeItem(`quiz_${quizId}`);
      // Remove PIN mapping
      localStorage.removeItem(`pin_${pin}`);
      
      // Update state
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been removed successfully.",
      });
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast({
      title: "PIN Copied!",
      description: "Game PIN has been copied to clipboard.",
    });
  };

  const shareQuiz = (pin: string) => {
    const joinUrl = `${window.location.origin}/join/${pin}`;
    navigator.clipboard.writeText(joinUrl);
    toast({
      title: "Join URL Copied!",
      description: "Join URL has been copied to clipboard.",
    });
  };

  const startGame = (quizId: string) => {
    navigate(`/host/${quizId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className="min-h-screen" 
      style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <Button variant="glass" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-2xl font-bold text-white">Abraj Quiz</span>
          </div>
          <div className="ml-auto">
            <h1 className="text-4xl font-bold text-white">Quiz History</h1>
          </div>
        </div>

        {quizzes.length === 0 ? (
          // Empty state
          <Card className="bg-white/95 backdrop-blur-sm shadow-game max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">No Quizzes Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't created any quizzes yet. Start by creating your first quiz!
              </p>
              <Button onClick={() => navigate('/create')} size="lg">
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Quiz grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-white/95 backdrop-blur-sm shadow-game hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {quiz.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuiz(quiz.id, quiz.pin)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Quiz stats */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {quiz.questions.length} Questions
                    </Badge>
                    <Badge variant="outline">
                      PIN: {quiz.pin}
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(quiz.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startGame(quiz.id)}
                      size="sm"
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Host
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPin(quiz.pin)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareQuiz(quiz.pin)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create new quiz button */}
        {quizzes.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate('/create')} 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Create Another Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}