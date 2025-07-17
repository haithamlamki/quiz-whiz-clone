export type QuestionType = 
  | 'multiple-choice' 
  | 'true-false' 
  | 'open-ended' 
  | 'puzzle' 
  | 'poll' 
  | 'word-cloud' 
  | 'brainstorm' 
  | 'slider' 
  | 'hotspot';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
  timeLimit: number;
  points: number;
  order: number;
  media?: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  };
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  answers: string[];
  correctAnswer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

export interface OpenEndedQuestion extends BaseQuestion {
  type: 'open-ended';
  sampleAnswers?: string[];
}

export interface PuzzleQuestion extends BaseQuestion {
  type: 'puzzle';
  items: string[];
  correctOrder: number[];
}

export interface PollQuestion extends BaseQuestion {
  type: 'poll';
  options: string[];
}

export interface WordCloudQuestion extends BaseQuestion {
  type: 'word-cloud';
  prompt: string;
}

export interface BrainstormQuestion extends BaseQuestion {
  type: 'brainstorm';
  prompt: string;
}

export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  min: number;
  max: number;
  step: number;
  correctValue?: number;
  unit?: string;
}

export interface HotspotQuestion extends BaseQuestion {
  type: 'hotspot';
  imageUrl: string;
  hotspots: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isCorrect: boolean;
  }[];
}

export type Question = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | OpenEndedQuestion 
  | PuzzleQuestion 
  | PollQuestion 
  | WordCloudQuestion 
  | BrainstormQuestion 
  | SliderQuestion 
  | HotspotQuestion;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdBy: string;
  createdAt: Date;
  backgroundTheme?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  answers: { questionId: string; selectedAnswer: number; isCorrect: boolean }[];
}

export interface GameSession {
  id: string;
  quiz: Quiz;
  players: Player[];
  currentQuestionIndex: number;
  gameState: 'waiting' | 'question' | 'results' | 'leaderboard' | 'finished';
  questionStartTime?: Date;
}