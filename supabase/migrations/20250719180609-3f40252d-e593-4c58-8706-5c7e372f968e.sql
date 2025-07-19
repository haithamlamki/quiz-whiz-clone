-- Add 'starting' status to games table for synchronized countdown
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check 
  CHECK (status IN ('waiting', 'starting', 'playing', 'finished'));