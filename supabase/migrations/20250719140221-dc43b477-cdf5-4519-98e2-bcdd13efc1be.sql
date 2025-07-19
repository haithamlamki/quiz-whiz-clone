-- Create quiz_reports table to store PDF report metadata
CREATE TABLE public.quiz_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  game_pin TEXT NOT NULL,
  file_url TEXT NOT NULL,
  report_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_reports
CREATE POLICY "Quiz owners can view their quiz reports" 
ON public.quiz_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE quizzes.id = quiz_reports.quiz_id 
    AND (quizzes.user_id = auth.uid() OR (quizzes.user_id IS NULL AND auth.uid() IS NULL))
  )
);

CREATE POLICY "Quiz owners can insert their quiz reports" 
ON public.quiz_reports 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE quizzes.id = quiz_reports.quiz_id 
    AND (quizzes.user_id = auth.uid() OR (quizzes.user_id IS NULL AND auth.uid() IS NULL))
  )
);

CREATE POLICY "Quiz owners can delete their quiz reports" 
ON public.quiz_reports 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes 
    WHERE quizzes.id = quiz_reports.quiz_id 
    AND (quizzes.user_id = auth.uid() OR (quizzes.user_id IS NULL AND auth.uid() IS NULL))
  )
);

-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quiz-reports', 'quiz-reports', true);

-- Storage policies for quiz reports
CREATE POLICY "Anyone can view quiz reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quiz-reports');

CREATE POLICY "Authenticated users can upload quiz reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quiz-reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own quiz reports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'quiz-reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own quiz reports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quiz-reports' AND auth.role() = 'authenticated');