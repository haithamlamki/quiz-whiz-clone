-- Add current_question_index to games table for question synchronization
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT -1;

-- Update existing games to have proper default
UPDATE games SET current_question_index = -1 WHERE current_question_index IS NULL;

-- Ensure anonymous users can read questions and answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'questions' 
        AND policyname = 'anon read questions'
    ) THEN
        CREATE POLICY "anon read questions" 
          ON questions FOR SELECT USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'answers' 
        AND policyname = 'anon read answers'
    ) THEN
        CREATE POLICY "anon read answers" 
          ON answers FOR SELECT USING (true);
    END IF;
END
$$;

-- Enable realtime for games table changes
ALTER PUBLICATION supabase_realtime ADD TABLE games;