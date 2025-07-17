import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Edit, 
  Trash2, 
  Clock, 
  Trophy,
  HelpCircle,
  Vote,
  Lightbulb,
  Move3D,
  Cloud,
  Target,
  ImageIcon,
  Video
} from 'lucide-react';
import { Question, QuestionType } from '@/types/quiz';

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
}

const getQuestionIcon = (type: QuestionType) => {
  switch (type) {
    case 'multiple-choice': return <HelpCircle className="h-4 w-4" />;
    case 'true-false': return <Vote className="h-4 w-4" />;
    case 'open-ended': return <Lightbulb className="h-4 w-4" />;
    case 'puzzle': return <Move3D className="h-4 w-4" />;
    case 'poll': return <Vote className="h-4 w-4" />;
    case 'word-cloud': return <Cloud className="h-4 w-4" />;
    case 'brainstorm': return <Lightbulb className="h-4 w-4" />;
    case 'slider': return <Move3D className="h-4 w-4" />;
    case 'hotspot': return <Target className="h-4 w-4" />;
    default: return <HelpCircle className="h-4 w-4" />;
  }
};

const getQuestionTypeName = (type: QuestionType) => {
  switch (type) {
    case 'multiple-choice': return 'Multiple Choice';
    case 'true-false': return 'True/False';
    case 'open-ended': return 'Open Ended';
    case 'puzzle': return 'Puzzle';
    case 'poll': return 'Poll';
    case 'word-cloud': return 'Word Cloud';
    case 'brainstorm': return 'Brainstorm';
    case 'slider': return 'Slider';
    case 'hotspot': return 'Hotspot';
    default: return type;
  }
};

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  index,
  onEdit,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="card-interactive hover:shadow-card-hover">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-md bg-muted hover:bg-muted/80 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Question Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getQuestionIcon(question.type)}
                      {getQuestionTypeName(question.type)}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg leading-tight">
                    {question.question}
                  </h3>

                  {/* Question Type Specific Preview */}
                  {question.type === 'multiple-choice' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {question.answers.slice(0, 4).map((answer, answerIndex) => (
                        <div 
                          key={answerIndex} 
                          className={`text-sm p-2 rounded border ${
                            question.correctAnswer === answerIndex 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {answer}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'true-false' && (
                    <div className="flex gap-2">
                      <Badge variant={question.correctAnswer ? 'default' : 'secondary'}>
                        True {question.correctAnswer && '✓'}
                      </Badge>
                      <Badge variant={!question.correctAnswer ? 'default' : 'secondary'}>
                        False {!question.correctAnswer && '✓'}
                      </Badge>
                    </div>
                  )}

                  {question.type === 'puzzle' && (
                    <div className="text-sm text-muted-foreground">
                      {question.items.length} items to order
                    </div>
                  )}

                  {question.type === 'poll' && (
                    <div className="text-sm text-muted-foreground">
                      {question.options.length} poll options
                    </div>
                  )}

                  {question.type === 'slider' && (
                    <div className="text-sm text-muted-foreground">
                      Range: {question.min} - {question.max}{question.unit}
                      {question.correctValue && ` (Answer: ${question.correctValue}${question.unit})`}
                    </div>
                  )}

                  {/* Media Preview */}
                  {question.media && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {question.media.type === 'image' ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                      Has {question.media.type}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(question)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Question Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{question.timeLimit}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>{question.points} pts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface QuestionsListProps {
  questions: Question[];
  onQuestionsReorder: (questions: Question[]) => void;
  onQuestionEdit: (question: Question) => void;
  onQuestionDelete: (id: string) => void;
}

export const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  onQuestionsReorder,
  onQuestionEdit,
  onQuestionDelete
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((question) => question.id === active.id);
      const newIndex = questions.findIndex((question) => question.id === over.id);

      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex).map(
        (question, index) => ({ ...question, order: index })
      );

      onQuestionsReorder(reorderedQuestions);
    }
  };

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No questions yet</h3>
              <p className="text-muted-foreground">
                Add your first question using the editor above
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <SortableQuestionItem
              key={question.id}
              question={question}
              index={index}
              onEdit={onQuestionEdit}
              onDelete={onQuestionDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};