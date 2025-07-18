-- Make user_id nullable in quizzes table to allow anonymous quiz creation
ALTER TABLE public.quizzes ALTER COLUMN user_id DROP NOT NULL;

-- Update the RLS policies to handle nullable user_id
DROP POLICY IF EXISTS "Quiz owners can update their quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quiz owners can delete their quizzes" ON public.quizzes;

CREATE POLICY "Quiz owners can update their quizzes" 
ON public.quizzes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND auth.uid() IS NULL) OR
  (auth.uid() IS NULL)
);

CREATE POLICY "Quiz owners can delete their quizzes" 
ON public.quizzes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND auth.uid() IS NULL) OR
  (auth.uid() IS NULL)
);