import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';
import { QuestionEditor } from '@/components/QuestionEditor';
import { QuestionsList } from '@/components/QuestionsList';
import { ArrowLeft, Save, Upload, Eye, Settings, Wand2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Question } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorCard } from '@/components/ErrorCard';
import { Loader } from '@/components/Loader';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editQuizId = searchParams.get('edit');
  
  const [isLoading, setIsLoading] = useState(!!editQuizId);
  const [error, setError] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [backgroundTheme, setBackgroundTheme] = useState('bg-sky-600');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleQuestionAdd = (question: Question) => {
    const newQuestion = { ...question, order: questions.length };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setEditingQuestion(null);
  };

  const handleQuestionsReorder = (reorderedQuestions: Question[]) => {
    setQuestions(reorderedQuestions);
  };

  const handleQuestionEdit = (question: Question) => {
    setEditingQuestion(question);
  };

  const handleQuestionDelete = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Load quiz data when in edit mode
  useEffect(() => {
    const loadQuizData = async () => {
      if (!editQuizId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch quiz with all questions
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            *,
            questions (*)
          `)
          .eq('id', editQuizId)
          .single();

        if (quizError) {
          throw new Error('Failed to fetch quiz data');
        }

        if (!quizData) {
          throw new Error('Quiz not found');
        }

        // Populate form with quiz data
        setQuizTitle(quizData.title || '');
        setQuizDescription(quizData.description || '');

        // Transform questions from database format to Question type
        if (quizData.questions && quizData.questions.length > 0) {
          const transformedQuestions: Question[] = quizData.questions.map((dbQuestion: any, index: number) => {
            const options = dbQuestion.options || {};
            
            return {
              id: dbQuestion.id,
              type: options.type || 'multiple-choice',
              question: dbQuestion.question_text,
              timeLimit: dbQuestion.time_limit || 20,
              points: options.points || 1000,
              order: index,
              // Add type-specific properties based on the question type
              ...(options.type === 'multiple-choice' && {
                answers: options.answers || [],
                correctAnswer: options.correctAnswer
              }),
              ...(options.type === 'true-false' && {
                correctAnswer: options.correctAnswer
              }),
              ...(options.type === 'puzzle' && {
                items: options.items || []
              }),
              ...(options.type === 'poll' && {
                options: options.options || []
              }),
              ...(options.type === 'hotspot' && {
                imageUrl: options.imageUrl,
                hotspots: options.hotspots || []
              })
            } as Question;
          });
          
          setQuestions(transformedQuestions);
        }

        toast({
          title: "Quiz Loaded",
          description: `Editing "${quizData.title}" with ${quizData.questions?.length || 0} questions.`,
        });

      } catch (error: any) {
        console.error('Error loading quiz:', error);
        setError(error.message || 'Failed to load quiz data');
        toast({
          title: "Failed to Load Quiz",
          description: error.message || "Unable to load quiz data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [editQuizId, toast]);

  const saveQuiz = async () => {
    // Validation with specific error messages
    if (!quizTitle.trim()) {
      toast({
        title: "Quiz Title Required",
        description: "Please enter a title for your quiz before saving.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "No Questions Added",
        description: "Please add at least one question to your quiz before saving.",
        variant: "destructive",
      });
      return;
    }

    // Validate each question has required fields
    const invalidQuestions = questions.filter(q => {
      if (!q.question.trim()) return true;
      
      switch (q.type) {
        case 'multiple-choice':
          const mcq = q as any;
          return !mcq.answers || mcq.answers.length < 2 || typeof mcq.correctAnswer !== 'number';
        case 'true-false':
          const tfq = q as any;
          return typeof tfq.correctAnswer !== 'boolean';
        case 'puzzle':
          const pq = q as any;
          return !pq.items || pq.items.length < 2;
        case 'poll':
          const pollq = q as any;
          return !pollq.options || pollq.options.length < 2;
        case 'hotspot':
          const hq = q as any;
          return !hq.imageUrl || !hq.hotspots || hq.hotspots.length === 0;
        default:
          return false;
      }
    });

    if (invalidQuestions.length > 0) {
      toast({
        title: "Incomplete Questions",
        description: `${invalidQuestions.length} question(s) are missing required information. Please complete all questions before saving.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const isEditing = !!editQuizId;
      const quizId = isEditing ? editQuizId : crypto.randomUUID();
      
      // Prepare quiz data
      const quizData = {
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        user_id: user?.id || null
      };
      
      console.log(`Attempting to ${isEditing ? 'update' : 'create'} quiz with data:`, quizData);
      
      if (isEditing) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', quizId);

        if (quizError) {
          console.error('Quiz update error:', quizError);
          throw new Error(`Failed to update quiz: ${quizError.message}`);
        }

        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('quiz_id', quizId);

        if (deleteError) {
          console.error('Questions deletion error:', deleteError);
          throw new Error(`Failed to update questions: ${deleteError.message}`);
        }
      } else {
        // Create new quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .insert({ id: quizId, ...quizData });

        if (quizError) {
          console.error('Quiz creation error:', quizError);
          throw new Error(`Failed to create quiz: ${quizError.message}`);
        }
      }

      // Save/update questions
      const questionsData = questions.sort((a, b) => a.order - b.order).map(q => ({
        id: isEditing ? q.id : crypto.randomUUID(),
        quiz_id: quizId,
        question_text: q.question,
        options: {
          type: q.type,
          answers: (q as any).answers || [],
          correctAnswer: (q as any).correctAnswer,
          items: (q as any).items || [],
          options: (q as any).options || [],
          hotspots: (q as any).hotspots || [],
          imageUrl: (q as any).imageUrl || null,
          points: q.points || 1000
        },
        time_limit: q.timeLimit || 20
      }));

      console.log('Attempting to save questions:', questionsData);
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData);

      if (questionsError) {
        console.error('Questions creation error:', questionsError);
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }

      // Store additional metadata in localStorage for compatibility
      const localQuizData = {
        id: quizId,
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        questions: questions.sort((a, b) => a.order - b.order),
        backgroundTheme: customBackground ? 'custom' : backgroundTheme,
        customBackground,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`quiz_${quizId}`, JSON.stringify(localQuizData));
      
      toast({
        title: isEditing ? "Quiz Updated Successfully!" : "Quiz Saved Successfully!",
        description: `Your quiz "${quizTitle}" has been ${isEditing ? 'updated' : 'saved'} and published.`,
      });
      
      navigate(`/quiz-saved/${quizId}`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "There was an error saving your quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomBackground(result);
        setBackgroundTheme('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const getQuestionTypeStats = () => {
    const stats = questions.reduce((acc, question) => {
      acc[question.type] = (acc[question.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats);
  };

  // Show loading state
  if (isLoading) {
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
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8 pt-4">
              <Button variant="glass" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <span className="text-2xl font-bold text-white">Abraj Quiz</span>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
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
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8 pt-4">
              <Button variant="glass" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <span className="text-2xl font-bold text-white">Abraj Quiz</span>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <ErrorCard 
                title="Failed to Load Quiz"
                message={error}
                onRetry={() => window.location.reload()}
              />
            </div>
          </div>
        </div>
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
        <div className="max-w-6xl mx-auto">
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
            <div className="ml-auto flex items-center gap-3">
              <h1 className="text-4xl font-bold text-white">
                {editQuizId ? 'Edit Quiz' : 'Create Quiz'}
              </h1>
              <Wand2 className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="setup" className="space-y-6">
            <div className="wizard-container">
              <TabsList className="wizard-steps grid w-full grid-cols-3 bg-transparent p-0 gap-2">
                <TabsTrigger value="setup" className="wizard-step flex items-center gap-2 data-[state=active]:wizard-step-active">
                  <Settings className="h-4 w-4" />
                  Setup
                </TabsTrigger>
                <TabsTrigger value="questions" className="wizard-step flex items-center gap-2 data-[state=active]:wizard-step-active">
                  <Wand2 className="h-4 w-4" />
                  Questions ({questions.length})
                </TabsTrigger>
                <TabsTrigger value="preview" className="wizard-step flex items-center gap-2 data-[state=active]:wizard-step-active">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Quiz Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <Card className="bg-gradient-card backdrop-blur-sm border-border/30">
                <CardHeader>
                  <CardTitle>Quiz Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                          id="title"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          placeholder="Enter an engaging quiz title"
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={quizDescription}
                          onChange={(e) => setQuizDescription(e.target.value)}
                          placeholder="Describe what this quiz is about..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="background">Background Theme</Label>
                        <select
                          id="background"
                          value={customBackground ? 'custom' : backgroundTheme}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              setBackgroundTheme(e.target.value);
                              setCustomBackground(null);
                            }
                          }}
                          className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="bg-sky-600">Sky Blue</option>
                          <option value="bg-purple-600">Purple</option>
                          <option value="bg-green-600">Green</option>
                          <option value="bg-orange-600">Orange</option>
                          <option value="bg-red-600">Red</option>
                          <option value="bg-indigo-600">Indigo</option>
                          <option value="bg-pink-600">Pink</option>
                          <option value="bg-teal-600">Teal</option>
                          {customBackground && <option value="custom">Custom Image</option>}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="background-image">Custom Background</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="background-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gradient-primary file:text-white hover:file:bg-gradient-primary"
                          />
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        {customBackground && (
                          <div className="space-y-2">
                            <img 
                              src={customBackground} 
                              alt="Custom background preview" 
                              className="w-full h-32 object-cover rounded-xl border"
                            />
                            <Button 
                              variant="game" 
                              size="sm"
                              onClick={() => {
                                setCustomBackground(null);
                                setBackgroundTheme('bg-sky-600');
                              }}
                            >
                              Remove Custom Background
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {questions.length > 0 && (
                <Card className="bg-gradient-card backdrop-blur-sm border-border/30">
                  <CardHeader>
                    <CardTitle>Quiz Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cta-primary">{questions.length}</div>
                        <div className="text-sm text-muted-foreground">Total Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cta-primary">
                          {Math.round(questions.reduce((sum, q) => sum + q.timeLimit, 0) / 60)}
                        </div>
                        <div className="text-sm text-muted-foreground">Estimated Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cta-primary">
                          {questions.reduce((sum, q) => sum + q.points, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-cta-primary">
                          {getQuestionTypeStats().length}
                        </div>
                        <div className="text-sm text-muted-foreground">Question Types</div>
                      </div>
                    </div>
                    
                    {getQuestionTypeStats().length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                          {getQuestionTypeStats().map(([type, count]) => (
                            <Badge key={type} variant="secondary">
                              {type.replace('-', ' ')}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-6">
              <QuestionEditor
                onQuestionAdd={handleQuestionAdd}
                existingQuestion={editingQuestion || undefined}
                onQuestionUpdate={editingQuestion ? handleQuestionUpdate : undefined}
              />

              {editingQuestion && (
                <div className="text-center">
                  <Button 
                    variant="game" 
                    onClick={() => setEditingQuestion(null)}
                  >
                    Cancel Edit
                  </Button>
                </div>
              )}

              <Card className="bg-gradient-card backdrop-blur-sm border-border/30">
                <CardHeader>
                  <CardTitle>Questions List ({questions.length})</CardTitle>
                  <p className="text-muted-foreground">
                    Drag and drop to reorder questions
                  </p>
                </CardHeader>
                <CardContent>
                  <QuestionsList
                    questions={questions}
                    onQuestionsReorder={handleQuestionsReorder}
                    onQuestionEdit={handleQuestionEdit}
                    onQuestionDelete={handleQuestionDelete}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <Card className="bg-gradient-card backdrop-blur-sm border-border/30">
                <CardHeader>
                  <CardTitle>Quiz Preview</CardTitle>
                  <p className="text-muted-foreground">
                    This is how your quiz will appear to participants
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold">{quizTitle || 'Untitled Quiz'}</h2>
                    <p className="text-lg text-muted-foreground">
                      {quizDescription || 'No description provided'}
                    </p>
                    <div className="flex justify-center gap-4">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        {questions.length} Questions
                      </Badge>
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        ~{Math.round(questions.reduce((sum, q) => sum + q.timeLimit, 0) / 60)} min
                      </Badge>
                    </div>
                  </div>

                  {questions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Question Overview</h3>
                      <div className="grid gap-3">
                        {questions.slice(0, 3).map((question, index) => (
                          <div key={question.id} className="p-4 border rounded-xl bg-white/50">
                            <div className="flex items-start gap-3">
                              <Badge variant="outline">{index + 1}</Badge>
                              <div>
                                <p className="font-medium">{question.question}</p>
                                <p className="text-sm text-muted-foreground">
                                  {question.type.replace('-', ' ')} • {question.timeLimit}s • {question.points} pts
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {questions.length > 3 && (
                          <div className="text-center text-muted-foreground">
                            ... and {questions.length - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="text-center mt-8">
            <Button 
              variant="game" 
              size="xl" 
              onClick={saveQuiz}
              disabled={!quizTitle || questions.length === 0}
              className="btn-float"
            >
              <Save className="h-6 w-6" />
              {editQuizId ? 'Update Quiz' : 'Save & Publish Quiz'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}