import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Logo from '@/components/Logo';
import { Play, Copy, Share2, Trash2, Clock, Users, ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string | null;
  questions: { id: string }[];
}

interface QuizReport {
  id: string;
  quiz_id: string;
  game_pin: string;
  file_url: string;
  report_title: string | null;
  created_at: string;
}

interface QuizWithReports extends Quiz {
  reports: QuizReport[];
}

export default function QuizHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingAll, setShowingAll] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [user]);

  const loadQuizzes = async () => {
    try {
      // Load user's quizzes with their reports
      let query = supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          created_at,
          user_id,
          questions (id)
        `);
      
      // Show user's quizzes first, or all anonymous quizzes if not authenticated or showing all
      if (user?.id && !showingAll) {
        query = query.eq('user_id', user.id);
      } else if (!user?.id || showingAll) {
        // For anonymous users or when showing all, show anonymous quizzes
        query = query.is('user_id', null);
      }
      
      const { data: quizzesData, error: quizzesError } = await query
        .order('created_at', { ascending: false });

      if (quizzesError) {
        console.error('Error loading quizzes:', quizzesError);
        setLoading(false);
        return;
      }

      // Load reports for each quiz
      const quizIds = quizzesData?.map(q => q.id) || [];
      const { data: reportsData, error: reportsError } = await supabase
        .from('quiz_reports')
        .select('*')
        .in('quiz_id', quizIds)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error loading reports:', reportsError);
      }

      // Group reports by quiz_id
      const reportsByQuiz = (reportsData || []).reduce((acc, report) => {
        if (!acc[report.quiz_id]) {
          acc[report.quiz_id] = [];
        }
        acc[report.quiz_id].push(report);
        return acc;
      }, {} as Record<string, QuizReport[]>);

      // Combine quizzes with their reports
      const quizzesWithReports: QuizWithReports[] = (quizzesData || []).map(quiz => ({
        ...quiz,
        reports: reportsByQuiz[quiz.id] || []
      }));

      setQuizzes(quizzesWithReports);
      setLoading(false);

    } catch (error) {
      console.error('Error loading quiz history:', error);
      setLoading(false);
    }
  };

  const claimAnonymousQuizzes = async () => {
    if (!user?.id) return;
    
    try {
      // Update all anonymous quizzes to be owned by current user
      const { error } = await supabase
        .from('quizzes')
        .update({ user_id: user.id })
        .is('user_id', null);
      
      if (error) {
        console.error('Error claiming quizzes:', error);
        toast({
          title: "Error",
          description: "Failed to claim anonymous quizzes.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Quizzes Claimed",
        description: "All anonymous quizzes have been linked to your account.",
      });
      
      // Reload quizzes
      loadQuizzes();
    } catch (error) {
      console.error('Error claiming quizzes:', error);
    }
  };

  const deleteQuiz = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        console.error('Error deleting quiz:', error);
        toast({
          title: "Error",
          description: "Failed to delete quiz. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Update state
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startGame = async (quizId: string) => {
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

  const downloadReport = (report: QuizReport) => {
    const link = document.createElement('a');
    link.href = report.file_url;
    link.download = `Quiz_Report_${report.game_pin}.pdf`;
    link.target = '_blank';
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <Card className="bg-white/95 backdrop-blur-sm shadow-game">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Quiz History...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        {(quizzes.length === 0 && user?.id && !showingAll) ? (
          // Empty state for authenticated users - show option to view anonymous quizzes
          <Card className="bg-white/95 backdrop-blur-sm shadow-game max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">No Personal Quizzes Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't created any personal quizzes. Start by creating your first quiz, or check for anonymous quizzes you may have created before logging in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/create')} size="lg">
                  Create Your First Quiz
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowingAll(true);
                    loadQuizzes();
                  }} 
                  size="lg"
                >
                  View Anonymous Quizzes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (quizzes.length === 0 && showingAll) ? (
          // Empty state when showing anonymous quizzes
          <Card className="bg-white/95 backdrop-blur-sm shadow-game max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">No Anonymous Quizzes Found</h2>
              <p className="text-muted-foreground mb-6">
                No anonymous quizzes available. Create a new quiz to get started!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/create')} size="lg">
                  Create New Quiz
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowingAll(false);
                    loadQuizzes();
                  }} 
                  size="lg"
                >
                  Back to My Quizzes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (quizzes.length === 0) ? (
          // Empty state for anonymous users
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
          // Quiz grid with header options
          <div className="space-y-6">
            {/* Header with view toggles */}
            {user?.id && (
              <div className="flex justify-between items-center bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-game">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {showingAll ? "Anonymous Quizzes" : "My Quizzes"} ({quizzes.length})
                  </h2>
                  {showingAll && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={claimAnonymousQuizzes}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Claim All Anonymous Quizzes
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={!showingAll ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowingAll(false);
                      loadQuizzes();
                    }}
                  >
                    My Quizzes
                  </Button>
                  <Button
                    variant={showingAll ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowingAll(true);
                      loadQuizzes();
                    }}
                  >
                    Anonymous
                  </Button>
                </div>
              </div>
            )}
            
            {/* Quiz grid */}
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
                    <div className="flex gap-1 ml-2">
                      {/* PDF Reports Button */}
                      {quiz.reports.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title={`${quiz.reports.length} PDF reports available`}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="ml-1 text-xs">{quiz.reports.length}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4" align="end">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText className="h-4 w-4" style={{ color: '#0087B8' }} />
                                <span className="font-semibold">PDF Reports ({quiz.reports.length})</span>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {quiz.reports.map((report) => (
                                  <div 
                                    key={report.id} 
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">
                                        PIN: {report.game_pin}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatDate(report.created_at)}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadReport(report)}
                                      className="ml-2 h-8 w-8 p-0"
                                      title="Download PDF"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuiz(quiz.id, quiz.title)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Quiz stats */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {quiz.questions.length} Questions
                    </Badge>
                    {quiz.reports.length > 0 && (
                      <Badge variant="outline" style={{ borderColor: '#0087B8', color: '#0087B8' }}>
                        {quiz.reports.length} Reports
                      </Badge>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(quiz.created_at)}
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
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
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