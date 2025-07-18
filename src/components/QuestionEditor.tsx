import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Move3D,
  HelpCircle,
  Vote,
  Cloud,
  Lightbulb,
  Target
} from 'lucide-react';
import { QuestionType, Question, BaseQuestion } from '@/types/quiz';

interface QuestionEditorProps {
  onQuestionAdd: (question: Question) => void;
  existingQuestion?: Question;
  onQuestionUpdate?: (question: Question) => void;
}

const questionTypes: { type: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    type: 'multiple-choice', 
    label: 'Multiple Choice', 
    icon: <HelpCircle className="h-4 w-4" />,
    description: 'Classic quiz with multiple answer options'
  },
  { 
    type: 'true-false', 
    label: 'True/False', 
    icon: <Vote className="h-4 w-4" />,
    description: 'Simple true or false questions'
  },
  { 
    type: 'open-ended', 
    label: 'Open Ended', 
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Text-based answers'
  },
  { 
    type: 'puzzle', 
    label: 'Puzzle', 
    icon: <Move3D className="h-4 w-4" />,
    description: 'Drag and drop to order items'
  },
  { 
    type: 'poll', 
    label: 'Poll', 
    icon: <Vote className="h-4 w-4" />,
    description: 'No correct answer, just opinions'
  },
  { 
    type: 'word-cloud', 
    label: 'Word Cloud', 
    icon: <Cloud className="h-4 w-4" />,
    description: 'Collect words to create a word cloud'
  },
  { 
    type: 'brainstorm', 
    label: 'Brainstorm', 
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Collect ideas and thoughts'
  },
  { 
    type: 'slider', 
    label: 'Slider', 
    icon: <Move3D className="h-4 w-4" />,
    description: 'Pick a value on a scale'
  },
  { 
    type: 'hotspot', 
    label: 'Hotspot', 
    icon: <Target className="h-4 w-4" />,
    description: 'Click on parts of an image'
  }
];

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onQuestionAdd,
  existingQuestion,
  onQuestionUpdate
}) => {
  const [questionType, setQuestionType] = useState<QuestionType>(
    existingQuestion?.type || 'multiple-choice'
  );
  const [question, setQuestion] = useState(existingQuestion?.question || '');
  const [timeLimit, setTimeLimit] = useState(existingQuestion?.timeLimit || 3);
  const [points, setPoints] = useState(existingQuestion?.points || 1000);
  const [media, setMedia] = useState(existingQuestion?.media || null);

  // Multiple Choice specific
  const [answers, setAnswers] = useState(
    existingQuestion?.type === 'multiple-choice' ? existingQuestion.answers : ['', '', '', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    existingQuestion?.type === 'multiple-choice' ? existingQuestion.correctAnswer : 0
  );

  // True/False specific
  const [trueFalseAnswer, setTrueFalseAnswer] = useState(
    existingQuestion?.type === 'true-false' ? existingQuestion.correctAnswer : true
  );

  // Open-ended specific
  const [sampleAnswers, setSampleAnswers] = useState(
    existingQuestion?.type === 'open-ended' ? existingQuestion.sampleAnswers || [] : []
  );

  // Puzzle specific
  const [puzzleItems, setPuzzleItems] = useState(
    existingQuestion?.type === 'puzzle' ? existingQuestion.items : ['']
  );

  // Poll specific
  const [pollOptions, setPollOptions] = useState(
    existingQuestion?.type === 'poll' ? existingQuestion.options : ['', '']
  );

  // Slider specific
  const [sliderMin, setSliderMin] = useState(
    existingQuestion?.type === 'slider' ? existingQuestion.min : 0
  );
  const [sliderMax, setSliderMax] = useState(
    existingQuestion?.type === 'slider' ? existingQuestion.max : 100
  );
  const [sliderStep, setSliderStep] = useState(
    existingQuestion?.type === 'slider' ? existingQuestion.step : 1
  );
  const [sliderCorrectValue, setSliderCorrectValue] = useState(
    existingQuestion?.type === 'slider' ? existingQuestion.correctValue : undefined
  );
  const [sliderUnit, setSliderUnit] = useState(
    existingQuestion?.type === 'slider' ? existingQuestion.unit || '' : ''
  );

  // Hotspot specific
  const [hotspotImage, setHotspotImage] = useState(
    existingQuestion?.type === 'hotspot' ? existingQuestion.imageUrl : ''
  );

  const handleMediaUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setMedia({ type, url, alt: file.name });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const addAnswer = () => {
    setAnswers([...answers, '']);
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
      if (correctAnswer >= newAnswers.length) {
        setCorrectAnswer(0);
      }
    }
  };

  const addPuzzleItem = () => {
    setPuzzleItems([...puzzleItems, '']);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const createQuestion = (): Question => {
    const baseQuestion: Omit<BaseQuestion, 'type'> = {
      id: existingQuestion?.id || crypto.randomUUID(),
      question,
      timeLimit,
      points,
      order: existingQuestion?.order || 0,
      media: media || undefined
    };

    switch (questionType) {
      case 'multiple-choice':
        return {
          ...baseQuestion,
          type: 'multiple-choice',
          answers: answers.filter(a => a.trim()),
          correctAnswer
        };

      case 'true-false':
        return {
          ...baseQuestion,
          type: 'true-false',
          correctAnswer: trueFalseAnswer
        };

      case 'open-ended':
        return {
          ...baseQuestion,
          type: 'open-ended',
          sampleAnswers: sampleAnswers.filter(a => a.trim())
        };

      case 'puzzle':
        const items = puzzleItems.filter(item => item.trim());
        return {
          ...baseQuestion,
          type: 'puzzle',
          items,
          correctOrder: items.map((_, index) => index)
        };

      case 'poll':
        return {
          ...baseQuestion,
          type: 'poll',
          options: pollOptions.filter(o => o.trim())
        };

      case 'word-cloud':
        return {
          ...baseQuestion,
          type: 'word-cloud',
          prompt: question
        };

      case 'brainstorm':
        return {
          ...baseQuestion,
          type: 'brainstorm',
          prompt: question
        };

      case 'slider':
        return {
          ...baseQuestion,
          type: 'slider',
          min: sliderMin,
          max: sliderMax,
          step: sliderStep,
          correctValue: sliderCorrectValue,
          unit: sliderUnit
        };

      case 'hotspot':
        return {
          ...baseQuestion,
          type: 'hotspot',
          imageUrl: hotspotImage,
          hotspots: []
        };

      default:
        throw new Error(`Unsupported question type: ${questionType}`);
    }
  };

  const handleSubmit = () => {
    if (!question.trim()) return;

    const newQuestion = createQuestion();
    
    if (existingQuestion && onQuestionUpdate) {
      onQuestionUpdate(newQuestion);
    } else {
      onQuestionAdd(newQuestion);
    }

    // Reset form
    setQuestion('');
    setAnswers(['', '', '', '']);
    setCorrectAnswer(0);
    setTrueFalseAnswer(true);
    setSampleAnswers([]);
    setPuzzleItems(['']);
    setPollOptions(['', '']);
    setMedia(null);
  };

  const answerColors = ['red', 'blue', 'yellow', 'green'] as const;

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {questionTypes.find(qt => qt.type === questionType)?.icon}
          {existingQuestion ? 'Edit Question' : 'Add Question'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Type Selection */}
        <div className="space-y-3">
          <Label>Question Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {questionTypes.map((qt) => (
              <Button
                key={qt.type}
                variant={questionType === qt.type ? 'cta' : 'outline'}
                size="sm"
                onClick={() => setQuestionType(qt.type)}
                className="flex flex-col items-center gap-2 h-auto p-4"
              >
                {qt.icon}
                <span className="text-xs">{qt.label}</span>
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {questionTypes.find(qt => qt.type === questionType)?.description}
          </p>
        </div>

        {/* Media Upload */}
        <div className="space-y-3">
          <Label>Media (Optional)</Label>
          <Tabs defaultValue="none" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="none">None</TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleMediaUpload(e, 'image')}
                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {media?.type === 'image' && (
                <img src={media.url} alt="Question media" className="w-full max-h-40 object-cover rounded-lg" />
              )}
            </TabsContent>

            <TabsContent value="video" className="space-y-3">
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => handleMediaUpload(e, 'video')}
                className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {media?.type === 'video' && (
                <video src={media.url} controls className="w-full max-h-40 rounded-lg" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              questionType === 'word-cloud' || questionType === 'brainstorm' 
                ? 'Enter the prompt...' 
                : 'Enter your question...'
            }
            className="min-h-[100px]"
          />
        </div>

        {/* Question Type Specific Fields */}
        {questionType === 'multiple-choice' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              <Button variant="outline" size="sm" onClick={addAnswer}>
                <Plus className="h-4 w-4" />
                Add Answer
              </Button>
            </div>
            <div className="grid gap-3">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded bg-answer-${answerColors[index % 4]}`} />
                  <Input
                    value={answer}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[index] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder={`Answer ${index + 1}`}
                    className={correctAnswer === index ? 'border-green-500' : ''}
                  />
                  <Button
                    variant={correctAnswer === index ? 'cta' : 'outline'}
                    size="sm"
                    onClick={() => setCorrectAnswer(index)}
                  >
                    {correctAnswer === index ? 'Correct' : 'Mark'}
                  </Button>
                  {answers.length > 2 && (
                    <Button variant="outline" size="sm" onClick={() => removeAnswer(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'true-false' && (
          <div className="space-y-3">
            <Label>Correct Answer</Label>
            <div className="flex items-center space-x-4">
              <Button
                variant={trueFalseAnswer ? 'cta' : 'outline'}
                onClick={() => setTrueFalseAnswer(true)}
              >
                True
              </Button>
              <Button
                variant={!trueFalseAnswer ? 'cta' : 'outline'}
                onClick={() => setTrueFalseAnswer(false)}
              >
                False
              </Button>
            </div>
          </div>
        )}

        {questionType === 'puzzle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items to Order</Label>
              <Button variant="outline" size="sm" onClick={addPuzzleItem}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {puzzleItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...puzzleItems];
                      newItems[index] = e.target.value;
                      setPuzzleItems(newItems);
                    }}
                    placeholder={`Item ${index + 1}`}
                  />
                  {puzzleItems.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPuzzleItems(puzzleItems.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'poll' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poll Options</Label>
              <Button variant="outline" size="sm" onClick={addPollOption}>
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'slider' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slider-min">Minimum Value</Label>
                <Input
                  id="slider-min"
                  type="number"
                  value={sliderMin}
                  onChange={(e) => setSliderMin(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="slider-max">Maximum Value</Label>
                <Input
                  id="slider-max"
                  type="number"
                  value={sliderMax}
                  onChange={(e) => setSliderMax(parseInt(e.target.value) || 100)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slider-step">Step Size</Label>
                <Input
                  id="slider-step"
                  type="number"
                  value={sliderStep}
                  onChange={(e) => setSliderStep(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="slider-unit">Unit (Optional)</Label>
                <Input
                  id="slider-unit"
                  value={sliderUnit}
                  onChange={(e) => setSliderUnit(e.target.value)}
                  placeholder="e.g., %, km, kg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="slider-correct">Correct Value (Optional)</Label>
              <Input
                id="slider-correct"
                type="number"
                value={sliderCorrectValue || ''}
                onChange={(e) => setSliderCorrectValue(parseInt(e.target.value) || undefined)}
                placeholder="Leave empty for opinion-based slider"
              />
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <Slider
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={[sliderCorrectValue || sliderMin]}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{sliderMin}{sliderUnit}</span>
                <span>{sliderMax}{sliderUnit}</span>
              </div>
            </div>
          </div>
        )}

        {questionType === 'hotspot' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hotspot-image">Image URL</Label>
              <Input
                id="hotspot-image"
                value={hotspotImage}
                onChange={(e) => setHotspotImage(e.target.value)}
                placeholder="Enter image URL or upload above"
              />
            </div>
            {hotspotImage && (
              <div className="space-y-2">
                <Label>Preview (Click to add hotspots later)</Label>
                <img 
                  src={hotspotImage} 
                  alt="Hotspot question" 
                  className="w-full max-h-60 object-contain border rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {questionType === 'open-ended' && (
          <div className="space-y-4">
            <Label>Sample Answers (Optional)</Label>
            <div className="space-y-2">
              {sampleAnswers.map((sample, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={sample}
                    onChange={(e) => {
                      const newSamples = [...sampleAnswers];
                      newSamples[index] = e.target.value;
                      setSampleAnswers(newSamples);
                    }}
                    placeholder={`Sample answer ${index + 1}`}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSampleAnswers(sampleAnswers.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSampleAnswers([...sampleAnswers, ''])}
              >
                <Plus className="h-4 w-4" />
                Add Sample Answer
              </Button>
            </div>
          </div>
        )}

        {/* Common Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="time-limit">Time Limit (seconds)</Label>
            <Input
              id="time-limit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 20)}
              min="5"
              max="300"
            />
          </div>
          <div>
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1000)}
              min="100"
              max="5000"
              step="100"
            />
          </div>
        </div>

        <Button 
          variant="cta" 
          size="lg" 
          onClick={handleSubmit}
          disabled={!question.trim()}
          className="w-full"
        >
          <Plus className="h-5 w-5" />
          {existingQuestion ? 'Update Question' : 'Add Question'}
        </Button>
      </CardContent>
    </Card>
  );
};