export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number; // index of correct answer
  timeLimit: number; // in seconds
  points: number;
}

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