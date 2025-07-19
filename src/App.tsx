import { Toaster } from "@/components/ui/toaster";
import { QuizBackgroundProvider } from "@/contexts/QuizBackgroundContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CreateQuiz from "./pages/CreateQuiz";
import QuizSaved from "./pages/QuizSaved";
import QuizHistory from "./pages/QuizHistory";
import JoinGame from "./pages/JoinGame";
import PlayGame from "./pages/PlayGame";
import GameResults from "./pages/GameResults";
import GameLobby from "./pages/GameLobby";
import HostDashboard from "./pages/HostDashboard";
import FinalResults from "./pages/FinalResults";
import DiscoverQuizzes from "./pages/DiscoverQuizzes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <QuizBackgroundProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/discover" element={<DiscoverQuizzes />} />
              
              {/* Protected Host Routes */}
              <Route path="/create" element={
                <ProtectedRoute requireHost={true}>
                  <CreateQuiz />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute requireHost={true}>
                  <QuizHistory />
                </ProtectedRoute>
              } />
              <Route path="/quiz-saved/:quizId" element={
                <ProtectedRoute requireHost={true}>
                  <QuizSaved />
                </ProtectedRoute>
              } />
              <Route path="/host/:quizId" element={
                <ProtectedRoute requireHost={true}>
                  <HostDashboard />
                </ProtectedRoute>
              } />
              
              {/* Open Player Routes */}
              <Route path="/join/:pin" element={<JoinGame />} />
              <Route path="/lobby/:pin/:playerName" element={<GameLobby />} />
              <Route path="/play/:pin/:playerName" element={<PlayGame />} />
              <Route path="/results/:pin/:playerName/:score" element={<GameResults />} />
              <Route path="/final-results/:pin" element={<FinalResults />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QuizBackgroundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
