import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Home, RotateCcw, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import abrajLogo from '@/assets/abraj-logo.png';

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
  const [isHost, setIsHost] = useState<boolean>(false);

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
            host_id,
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

        // Check if current user is the host (any authenticated user is considered a host)
        const { data: { user } } = await supabase.auth.getUser();
        const isUserHost = !!user; // Same logic as AuthContext
        console.log('[FinalResults] isHost check:', { 
          userId: user?.id, 
          hostId: gameInfo.host_id, 
          isHost: isUserHost,
          authUser: !!user
        });
        setIsHost(isUserHost);

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

  const handlePlayAgain = async () => {
    if (!gameData || !pin) return;

    try {
      // Get the current game's quiz_id
      const { data: gameInfo, error: gameError } = await supabase
        .from('games')
        .select('quiz_id')
        .eq('game_pin', pin)
        .single();

      if (gameError || !gameInfo) {
        console.error('Failed to get quiz ID');
        return;
      }

      // Navigate to host dashboard with the same quiz
      navigate(`/host/${gameInfo.quiz_id}`);
    } catch (error) {
      console.error('Error restarting quiz:', error);
    }
  };

  const generatePDF = () => {
    if (!gameData || !questions.length) return;

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Section with ABRAJ Logo
    const logoImg = new Image();
    logoImg.onload = () => {
      // Add logo to the left side of the header
      doc.addImage(logoImg, 'PNG', 40, 20, 120, 30);
      
      // Continue with the rest of the PDF generation
      completePDFGeneration();
    };
    logoImg.onerror = () => {
      // If logo fails to load, continue without it
      completePDFGeneration();
    };
    logoImg.src = '/lovable-uploads/babf912f-a1b1-4a0f-a5a1-f08ff17d8a6d.png';

    const completePDFGeneration = async () => {
      // Add subtitle text next to logo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Quiz Report', 170, 40);

      // 2. Quiz Title (Centered)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(gameData.quiz_title || 'Quiz Report', pageWidth / 2, 60, { align: 'center' });

      // 3. Date (Right side)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Report Date: ${dateStr}`, pageWidth - 40, 40, { align: 'right' });

      // 4. Quiz Information Box
      const infoBoxY = 80;
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, infoBoxY, pageWidth - 80, 35, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Quiz Information', 50, infoBoxY + 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Game PIN: ${pin}`, 50, infoBoxY + 32);
      doc.text(`Total Questions: ${questions.length}`, 150, infoBoxY + 32);
      doc.text(`Total Players: ${results.length}`, 280, infoBoxY + 32);
      
      if (gameData.quiz_description) {
        doc.text(`Description: ${gameData.quiz_description.substring(0, 60)}${gameData.quiz_description.length > 60 ? '...' : ''}`, 400, infoBoxY + 32);
      }

      // 5. Questions and Answers section with all options
      let currentY = 130;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Questions & Answers:', 40, currentY);

      currentY += 20;

      // Create detailed questions table with all options shown
      const questionTableData: any[] = [];
      questions.forEach((question, index) => {
        // Build options display with correct answer highlighted
        const optionsDisplay = question.options.map((option, optIndex) => {
          const answerPrefix = ['A)', 'B)', 'C)', 'D)'][optIndex] || `${optIndex + 1})`;
          return option.correct 
            ? `${answerPrefix} ${option.text} ✓` 
            : `${answerPrefix} ${option.text}`;
        }).join('\n');
        
        // Find correct answer letter
        const correctIndex = question.options.findIndex(opt => opt.correct);
        const correctLetter = correctIndex >= 0 ? ['A', 'B', 'C', 'D'][correctIndex] || (correctIndex + 1).toString() : '?';
        
        // Add question row with all options
        questionTableData.push([
          (index + 1).toString(),
          `${question.question_text}\n\n${optionsDisplay}`,
          correctLetter
        ]);
      });

      (doc as any).autoTable({
        startY: currentY,
        head: [['#', 'Question / Options', 'Correct']],
        body: questionTableData,
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          lineHeight: 1.4
        },
        headStyles: { 
          fillColor: [0, 135, 184], 
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 380 },
          2: { cellWidth: 40, halign: 'center' },
        },
        didParseCell: (data: any) => {
          // Style correct answer column with ABRAJ blue-teal
          if (data.column.index === 2) {
            data.cell.styles.fillColor = [0, 135, 184];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
          
          // Style question number rows
          if (data.column.index === 0) {
            data.cell.styles.fillColor = [240, 248, 255];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      // Check if we need a new page for leaderboard
      const leaderboardStartY = (doc as any).lastAutoTable.finalY + 30;
      if (leaderboardStartY > pageHeight - 200) {
        doc.addPage();
        currentY = 50;
      } else {
        currentY = leaderboardStartY;
      }

      // 7. Leaderboard section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Leaderboard:', 40, currentY);

      const resultRows = results.map((r, i) => [
        (i + 1).toString(),
        r.name,
        r.score.toString(),
        `${r.correctAnswers}/${gameData.total_questions}`,
        `${r.avgTime}s`
      ]);

      (doc as any).autoTable({
        startY: currentY + 15,
        head: [['Rank', 'Player Name', 'Score', 'Correct', 'Avg Time']],
        body: resultRows,
        styles: { 
          fontSize: 10, 
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        headStyles: { 
          fillColor: [0, 135, 184],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 50, halign: 'center' },
          1: { cellWidth: 180 },
          2: { cellWidth: 80, halign: 'center' },
          3: { cellWidth: 80, halign: 'center' },
          4: { cellWidth: 80, halign: 'center' },
        },
        didParseCell: (data: any) => {
          // Highlight top 3 players
          if (data.column.index === 0) {
            const rank = parseInt(data.cell.text);
            if (rank === 1) {
              data.cell.styles.fillColor = [255, 215, 0]; // Gold
              data.cell.styles.textColor = [0, 0, 0];
            } else if (rank === 2) {
              data.cell.styles.fillColor = [192, 192, 192]; // Silver
              data.cell.styles.textColor = [0, 0, 0];
            } else if (rank === 3) {
              data.cell.styles.fillColor = [205, 127, 50]; // Bronze
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
        },
      });

      // 8. Add footer with generation info
      const finalY = (doc as any).lastAutoTable.finalY || currentY + 100;
      if (finalY < pageHeight - 60) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated by ABRAJ QuizMaster - ${new Date().toLocaleString()}`, 40, pageHeight - 30);
      }

      // 9. Page numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 15, {
          align: 'center',
        });
      }

      // 10. Save PDF to storage and create database record
      const fileName = `Quiz_Report_${gameData.quiz_title?.replace(/[^a-z0-9]/gi, '_') || 'Quiz'}_${pin}_${Date.now()}.pdf`;
      const pdfBlob = doc.output('blob');
      
      try {
        // Get quiz_id from current game
        const { data: currentGame, error: gameError } = await supabase
          .from('games')
          .select('quiz_id')
          .eq('game_pin', pin)
          .single();

        if (!gameError && currentGame) {
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('quiz-reports')
            .upload(fileName, pdfBlob, {
              contentType: 'application/pdf',
              upsert: false
            });

          if (!uploadError) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('quiz-reports')
              .getPublicUrl(fileName);

            // Save metadata to database
            const { error: dbError } = await supabase
              .from('quiz_reports')
              .insert({
                quiz_id: currentGame.quiz_id,
                game_pin: pin,
                file_url: urlData.publicUrl,
                report_title: `${gameData.quiz_title} - ${dateStr}`
              });

            if (dbError) {
              console.error('Error saving report metadata:', dbError);
            }

            // Download the file
            const link = document.createElement('a');
            link.href = urlData.publicUrl;
            link.download = fileName;
            link.click();
            return;
          }
        }
        
        // Fallback to local download if upload fails
        doc.save(fileName);
        
      } catch (error) {
        console.error('Error handling PDF:', error);
        // Fallback to local download
        doc.save(fileName);
      }
    };
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

          {/* Action Buttons - Different for hosts vs players */}
          <div className="flex justify-center gap-4 flex-wrap">
            {isHost ? (
              // Host buttons
              <>
                <Button 
                  variant="game" 
                  size="lg"
                  onClick={generatePDF}
                  disabled={!gameData || !questions.length}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="game" 
                  size="lg"
                  onClick={() => navigate('/')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Button>
                <Button 
                  variant="game" 
                  size="lg"
                  onClick={handlePlayAgain}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Play Again
                </Button>
              </>
            ) : (
              // Player buttons
              <>
                <Button 
                  variant="game" 
                  size="lg"
                  onClick={() => navigate('/')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Button>
                <Button 
                  variant="game" 
                  size="lg"
                  onClick={() => navigate('/join')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Join New Game
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}