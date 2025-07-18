import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationBar } from '@/components/NavigationBar';
import { Search, TrendingUp, Star, Clock, Users, Filter, BookOpen, GraduationCap, Lightbulb, Globe, Zap, Trophy, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Sample quiz data with more details
const sampleQuizzes = [
  {
    id: '1',
    title: 'General Knowledge',
    description: 'Test your knowledge across various topics including history, science, and culture',
    creator: 'Dr. Smith',
    thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
    playerCount: 1256,
    duration: '8 min',
    difficulty: 'Medium',
    category: 'General',
    subject: 'Mixed',
    grade: 'All Ages',
    rating: 4.8,
    tags: ['popular', 'featured'],
    plays: 5420,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Advanced Physics',
    description: 'Quantum mechanics, relativity, and modern physics concepts',
    creator: 'Prof. Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    playerCount: 89,
    duration: '15 min',
    difficulty: 'Hard',
    category: 'Science',
    subject: 'Physics',
    grade: 'High School',
    rating: 4.9,
    tags: ['challenging', 'trending'],
    plays: 234,
    createdAt: '2024-02-10'
  },
  {
    id: '3',
    title: 'World History Timeline',
    description: 'Journey through major historical events from ancient civilizations to modern times',
    creator: 'Ms. Williams',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
    playerCount: 734,
    duration: '12 min',
    difficulty: 'Medium',
    category: 'History',
    subject: 'World History',
    grade: 'Middle School',
    rating: 4.7,
    tags: ['educational', 'featured'],
    plays: 2156,
    createdAt: '2024-01-28'
  },
  {
    id: '4',
    title: 'JavaScript Fundamentals',
    description: 'Essential concepts for web development including ES6+ features',
    creator: 'CodeMaster',
    thumbnail: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop',
    playerCount: 456,
    duration: '20 min',
    difficulty: 'Easy',
    category: 'Technology',
    subject: 'Programming',
    grade: 'Beginner',
    rating: 4.6,
    tags: ['programming', 'popular'],
    plays: 1834,
    createdAt: '2024-02-05'
  },
  {
    id: '5',
    title: 'Climate Change Quiz',
    description: 'Understanding environmental science and climate change impacts',
    creator: 'EcoEducator',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop',
    playerCount: 892,
    duration: '10 min',
    difficulty: 'Medium',
    category: 'Science',
    subject: 'Environmental Science',
    grade: 'High School',
    rating: 4.8,
    tags: ['trending', 'important'],
    plays: 3245,
    createdAt: '2024-02-12'
  },
  {
    id: '6',
    title: 'Art History Masters',
    description: 'Famous paintings, artists, and art movements throughout history',
    creator: 'ArtCritic',
    thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
    playerCount: 324,
    duration: '14 min',
    difficulty: 'Medium',
    category: 'Arts',
    subject: 'Art History',
    grade: 'All Ages',
    rating: 4.5,
    tags: ['creative', 'cultural'],
    plays: 876,
    createdAt: '2024-01-20'
  }
];

const categories = ['All', 'Science', 'History', 'Technology', 'Arts', 'General'];
const subjects = ['All', 'Mixed', 'Physics', 'World History', 'Programming', 'Environmental Science', 'Art History'];
const grades = ['All', 'All Ages', 'Elementary', 'Middle School', 'High School', 'College', 'Adult', 'Beginner'];
const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const sortOptions = ['Most Popular', 'Newest', 'Highest Rated', 'Most Plays', 'Shortest', 'Longest'];

interface QuizCardProps {
  quiz: typeof sampleQuizzes[0];
  onPlay: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onPlay }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="group card-interactive hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/30 animate-slide-up overflow-hidden">
      <div className="relative">
        <img 
          src={quiz.thumbnail} 
          alt={quiz.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {quiz.tags.includes('featured') && (
            <Badge className="bg-brand-purple/90 text-white border-0">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {quiz.tags.includes('trending') && (
            <Badge className="bg-brand-orange/90 text-white border-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge className={getDifficultyColor(quiz.difficulty)}>
            {quiz.difficulty}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {quiz.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              by {quiz.creator}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{quiz.rating}</span>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">
          {quiz.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {quiz.subject}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            {quiz.grade}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{quiz.playerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{quiz.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>{quiz.plays.toLocaleString()} plays</span>
            </div>
          </div>
        </div>
        
        <Button variant="cta" size="cta" className="w-full" onClick={onPlay}>
          <Zap className="h-4 w-4" />
          Play Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default function DiscoverQuizzes() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedQuizzes = useMemo(() => {
    let filtered = sampleQuizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           quiz.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           quiz.subject.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || quiz.category === selectedCategory;
      const matchesSubject = selectedSubject === 'All' || quiz.subject === selectedSubject;
      const matchesGrade = selectedGrade === 'All' || quiz.grade === selectedGrade;
      const matchesDifficulty = selectedDifficulty === 'All' || quiz.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesSubject && matchesGrade && matchesDifficulty;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'Highest Rated':
          return b.rating - a.rating;
        case 'Most Plays':
          return b.plays - a.plays;
        case 'Shortest':
          return parseInt(a.duration) - parseInt(b.duration);
        case 'Longest':
          return parseInt(b.duration) - parseInt(a.duration);
        case 'Most Popular':
        default:
          return b.playerCount - a.playerCount;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedSubject, selectedGrade, selectedDifficulty, sortBy]);

  const handlePlayQuiz = (quizId: string) => {
    navigate(`/host/${quizId}`);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSubject('All');
    setSelectedGrade('All');
    setSelectedDifficulty('All');
    setSortBy('Most Popular');
  };

  const activeFiltersCount = [selectedCategory, selectedSubject, selectedGrade, selectedDifficulty]
    .filter(filter => filter !== 'All').length;

  return (
    <>
      <NavigationBar />
      
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
          <div className="text-center mb-8 pt-8">
            <h1 className="text-hero font-extrabold tracking-tight text-white text-3d mb-4">
              Discover Quizzes
            </h1>
            <p className="text-body-lg font-normal text-white/90 mb-8 max-w-2xl mx-auto">
              Explore thousands of quizzes across different subjects and difficulty levels
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-6xl mx-auto mb-8">
            <Card className="bg-white/95 backdrop-blur-sm shadow-card border-0 p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search quizzes, creators, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {filteredAndSortedQuizzes.length} quiz{filteredAndSortedQuizzes.length !== 1 ? 'es' : ''} found
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grade Level</label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Difficulty</label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map(difficulty => (
                          <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {activeFiltersCount > 0 && (
                    <div className="col-span-2 md:col-span-4 pt-2">
                      <Button variant="outline" onClick={clearAllFilters} size="sm">
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Category Filters */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.slice(1).map(category => {
                const icons = {
                  Science: Lightbulb,
                  History: Globe,
                  Technology: Zap,
                  Arts: Heart,
                  General: BookOpen
                };
                const Icon = icons[category as keyof typeof icons] || BookOpen;
                
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "cta" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Quiz Grid */}
          <div className="max-w-6xl mx-auto">
            {filteredAndSortedQuizzes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedQuizzes.map(quiz => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onPlay={() => handlePlayQuiz(quiz.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/95 backdrop-blur-sm shadow-card border-0 p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters to discover more quizzes.
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}