-- Add current_question_index to games table for question synchronization
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT -1;

-- Update existing games to have proper default
UPDATE games SET current_question_index = -1 WHERE current_question_index IS NULL;

-- Ensure anonymous users can read questions and answers
CREATE POLICY IF NOT EXISTS "anon read questions" 
  ON questions FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "anon read answers" 
  ON answers FOR SELECT USING (true);

-- Enable realtime for games table changes
ALTER PUBLICATION supabase_realtime ADD TABLE games;