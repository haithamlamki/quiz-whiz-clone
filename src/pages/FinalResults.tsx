import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Home, RotateCcw, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface PlayerResult {
  rank: number;
  name: string;
  score: number;
  correctAnswers: number;
  avgTime: number;
}

interface GameData {
  quiz_title: string;
  total_questions: number;
  quiz_description?: string;
}

interface QuestionData {
  id: string;
  question_text: string;
  options: { text: string; correct: boolean }[];
}

interface DetailedPlayerResult extends PlayerResult {
  answers: {
    question_id: string;
    is_correct: boolean;
    time_taken_ms: number;
  }[];
}

export default function FinalResults() {
  const { pin } = useParams();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailedResults, setDetailedResults] = useState<DetailedPlayerResult[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);

  useEffect(() => {
    const loadFinalResults = async () => {
      if (!pin) {
        setError('Game PIN not found');
        setLoading(false);
        return;
      }

      try {
        // Get game and quiz info with detailed questions
        const { data: gameInfo, error: gameError } = await supabase
          .from('games')
          .select(`
            id,
            quiz_id,
            quizzes (
              title,
              description,
              questions (
                id,
                question_text,
                options
              )
            )
          `)
          .eq('game_pin', pin)
          .single();

        if (gameError || !gameInfo) {
          setError('Game not found');
          setLoading(false);
          return;
        }

        // Get all players with their detailed answers
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            score,
            answers (
              question_id,
              is_correct,
              time_taken_ms
            )
          `)
          .eq('game_id', gameInfo.id)
          .order('score', { ascending: false });

        if (playersError) {
          setError('Failed to load player data');
          setLoading(false);
          return;
        }

        // Process results
        const processedResults: PlayerResult[] = (playersData || []).map((player, index) => {
          const correctAnswers = player.answers?.filter(a => a.is_correct).length || 0;
          const avgTime = player.answers?.length 
            ? player.answers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / player.answers.length / 1000
            : 0;

          return {
            rank: index + 1,
            name: player.name,
            score: player.score || 0,
            correctAnswers,
            avgTime: Number(avgTime.toFixed(1))
          };
        });

        // Process detailed results for PDF
        const processedDetailedResults: DetailedPlayerResult[] = (playersData || []).map((player, index) => ({
          rank: index + 1,
          name: player.name,
          score: player.score || 0,
          correctAnswers: player.answers?.filter(a => a.is_correct).length || 0,
          avgTime: player.answers?.length 
            ? Number((player.answers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / player.answers.length / 1000).toFixed(1))
            : 0,
          answers: player.answers || []
        }));

        setResults(processedResults);
        setDetailedResults(processedDetailedResults);
        
        // Type-safe question processing
        const questionData: QuestionData[] = (gameInfo.quizzes?.questions || []).map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options as { text: string; correct: boolean }[] : []
        }));
        
        setQuestions(questionData);
        setGameData({
          quiz_title: gameInfo.quizzes?.title || 'Quiz',
          quiz_description: gameInfo.quizzes?.description || '',
          total_questions: gameInfo.quizzes?.questions?.length || 0
        });
        setLoading(false);

      } catch (err) {
        console.error('Error loading final results:', err);
        setError('Failed to load results');
        setLoading(false);
      }
    };

    loadFinalResults();
  }, [pin]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-orange-600" />;
      default: return <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-bold">{rank}</div>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-300';
    }
  };

  const generatePDF = () => {
    if (!gameData || !questions.length) return;

    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(gameData.quiz_title, 20, yPosition);
    yPosition += 15;
    
    // Game info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Game PIN: ${pin}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    
    if (gameData.quiz_description) {
      doc.text(`Description: ${gameData.quiz_description}`, 20, yPosition);
      yPosition += 15;
    }
    
    // Summary statistics
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Quiz Summary', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Players: ${results.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Questions: ${gameData.total_questions}`, 20, yPosition);
    yPosition += 8;
    const avgAccuracy = results.length > 0 && gameData?.total_questions ? 
      Math.round((results.reduce((acc, p) => acc + p.correctAnswers, 0) / (results.length * gameData.total_questions)) * 100) : 0;
    doc.text(`Overall Accuracy: ${avgAccuracy}%`, 20, yPosition);
    yPosition += 20;
    
    // Leaderboard
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Final Leaderboard', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    results.forEach((player, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      const rankText = `${player.rank}. ${player.name}`;
      const scoreText = `Score: ${player.score.toLocaleString()}`;
      const accuracyText = `Correct: ${player.correctAnswers}/${gameData.total_questions}`;
      const timeText = `Avg Time: ${player.avgTime}s`;
      
      doc.setFont(undefined, 'bold');
      doc.text(rankText, 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(scoreText, 120, yPosition);
      yPosition += 8;
      doc.text(accuracyText, 30, yPosition);
      doc.text(timeText, 120, yPosition);
      yPosition += 12;
    });
    
    // Questions and correct answers
    if (questions.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Quiz Questions & Answers', 20, yPosition);
      yPosition += 20;
      
      questions.forEach((question, index) => {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Q${index + 1}: ${question.question_text}`, 20, yPosition);
        yPosition += 12;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        question.options.forEach((option, optIndex) => {
          const prefix = option.correct ? '✓' : '  ';
          const text = `${prefix} ${String.fromCharCode(65 + optIndex)}. ${option.text}`;
          doc.text(text, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 8;
      });
    }
    
    // Save the PDF
    const fileName = `${gameData.quiz_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results_${pin}.pdf`;
    doc.save(fileName);
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading Results...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'var(--gradient-classroom)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <Card className="bg-white/95 backdrop-blur-sm shadow-game">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="game">
              Go Home
            </Button>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-white mb-2">Game Complete!</h1>
            <p className="text-xl text-white/80">
              Final Results for Game PIN: {pin}
            </p>
          </div>

          {/* Podium - Top 3 */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle className="text-center text-2xl">🏆 Top 3 Players 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {results.slice(0, 3).map((player, index) => (
                  <div key={player.rank} className="text-center">
                    <div 
                      className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${getRankBg(player.rank)}`}
                    >
                      {getRankIcon(player.rank)}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{player.name}</h3>
                    <div className="text-2xl font-black text-primary mb-1">
                      {player.score.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {player.correctAnswers}/{gameData?.total_questions || 0} correct
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.avgTime}s avg
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complete Leaderboard */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle>Complete Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((player) => (
                  <div 
                    key={player.rank}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      player.rank <= 3 ? getRankBg(player.rank) + ' text-white' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getRankIcon(player.rank)}
                      <div>
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm opacity-80">
                          {player.correctAnswers}/{gameData?.total_questions || 0} correct
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {player.score.toLocaleString()}
                      </div>
                      <div className="text-sm opacity-80">
                        {player.avgTime}s avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Stats */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-game">
            <CardHeader>
              <CardTitle>Game Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{results.length}</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{gameData?.total_questions || 0}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {results.length > 0 ? Math.round(results.reduce((acc, p) => acc + p.avgTime, 0) / results.length) : 0}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Answer Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {results.length > 0 && gameData?.total_questions ? 
                      Math.round((results.reduce((acc, p) => acc + p.correctAnswers, 0) / (results.length * gameData.total_questions)) * 100) 
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button 
              variant="game" 
              size="lg"
              onClick={generatePDF}
              disabled={!gameData || !questions.length}
            >
              <Download className="h-5 w-5" />
              Download PDF Report
            </Button>
            <Button 
              variant="game" 
              size="lg"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
              Home
            </Button>
            <Button 
              variant="game" 
              size="lg"
              onClick={() => navigate('/create')}
            >
              <RotateCcw className="h-5 w-5" />
              Create New Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}