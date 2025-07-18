-- Update RLS policies to allow anonymous quiz creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON public.quizzes;

-- Create new policies that allow anonymous quiz creation
CREATE POLICY "Anyone can create quizzes" 
ON public.quizzes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Quiz owners can update their quizzes" 
ON public.quizzes 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Quiz owners can delete their quizzes" 
ON public.quizzes 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Update questions policies to allow anonymous question creation
DROP POLICY IF EXISTS "Users can add questions to their own quizzes" ON public.questions;
DROP POLICY IF EXISTS "Users can update questions in their own quizzes" ON public.questions;
DROP POLICY IF EXISTS "Users can delete questions from their own quizzes" ON public.questions;

CREATE POLICY "Anyone can add questions to quizzes" 
ON public.questions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Quiz owners can update questions" 
ON public.questions 
FOR UPDATE 
USING (
  auth.uid() = (SELECT user_id FROM quizzes WHERE id = questions.quiz_id) 
  OR auth.uid() IS NULL
);

CREATE POLICY "Quiz owners can delete questions" 
ON public.questions 
FOR DELETE 
USING (
  auth.uid() = (SELECT user_id FROM quizzes WHERE id = questions.quiz_id) 
  OR auth.uid() IS NULL
);