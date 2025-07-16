export interface PlayerStats {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  averageTime: number;
  rank: number;
}

export interface GameStats {
  totalPlayers: number;
  totalQuestions: number;
  averageScore: number;
  averageAccuracy: number;
  gamePin: string;
}