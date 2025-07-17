import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { Plus, Trash2, Save, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/types/quiz';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [backgroundTheme, setBackgroundTheme] = useState('bg-sky-600');
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    question: '',
    answers: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 20,
    points: 1000
  });

  const addQuestion = () => {
    if (currentQuestion.question && currentQuestion.answers?.some(a => a.trim())) {
      const newQuestion: Question = {
        id: crypto.randomUUID(),
        question: currentQuestion.question,
        answers: currentQuestion.answers || [],
        correctAnswer: currentQuestion.correctAnswer || 0,
        timeLimit: currentQuestion.timeLimit || 20,
        points: currentQuestion.points || 1000
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion({
        question: '',
        answers: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 20,
        points: 1000
      });
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...(currentQuestion.answers || ['', '', '', ''])];
    newAnswers[index] = value;
    setCurrentQuestion({ ...currentQuestion, answers: newAnswers });
  };

  const saveQuiz = () => {
    if (quizTitle && questions.length > 0) {
      // In a real app, this would save to a backend
      console.log('Saving quiz:', { 
        title: quizTitle, 
        description: quizDescription, 
        questions, 
        backgroundTheme: customBackground ? 'custom' : backgroundTheme,
        customBackground 
      });
      navigate('/');
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

  const answerColors = ['red', 'blue', 'yellow', 'green'] as const;

  return (
    <div className="min-h-screen bg-gradient-game">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <div className="absolute top-4 left-4">
            <Logo size="md" />
          </div>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pt-8">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-white">Create Quiz</h1>
          </div>

          {/* Quiz Info */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Enter quiz description"
                />
              </div>
              <div>
                <Label htmlFor="background">Background Theme</Label>
                <div className="space-y-4">
                  <select
                    id="background"
                    value={customBackground ? 'custom' : backgroundTheme}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setBackgroundTheme(e.target.value);
                        setCustomBackground(null);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

                  {/* Custom Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="background-image">Or Upload Custom Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="background-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {customBackground && (
                      <div className="mt-2">
                        <img 
                          src={customBackground} 
                          alt="Custom background preview" 
                          className="w-full h-24 object-cover rounded-md border"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
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

          {/* Current Question */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                  placeholder="Enter your question"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(currentQuestion.answers || ['', '', '', '']).map((answer, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`answer-${index}`} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded bg-answer-${answerColors[index]}`} />
                      Answer {index + 1}
                      {currentQuestion.correctAnswer === index && (
                        <span className="text-green-600 text-sm font-bold">✓ Correct</span>
                      )}
                    </Label>
                    <Input
                      id={`answer-${index}`}
                      value={answer}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      placeholder={`Answer ${index + 1}`}
                      className={currentQuestion.correctAnswer === index ? 'border-green-500' : ''}
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={currentQuestion.timeLimit}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: parseInt(e.target.value) || 20 })}
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1000 })}
                    min="100"
                    max="2000"
                    step="100"
                  />
                </div>
              </div>

              <Button variant="game" onClick={addQuestion}>
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <Card className="mb-8 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Questions ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{index + 1}. {question.question}</h3>
                      <p className="text-sm text-muted-foreground">
                        {question.timeLimit}s • {question.points} points
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeQuestion(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Quiz */}
          <div className="text-center">
            <Button 
              variant="game" 
              size="hero" 
              onClick={saveQuiz}
              disabled={!quizTitle || questions.length === 0}
            >
              <Save className="h-5 w-5" />
              Save Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}