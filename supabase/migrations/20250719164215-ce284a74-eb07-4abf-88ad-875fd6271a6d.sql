-- Fix the INSERT policy for quiz_reports to include proper WITH CHECK clause
DROP POLICY IF EXISTS "Quiz owners can insert their quiz reports" ON public.quiz_reports;

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