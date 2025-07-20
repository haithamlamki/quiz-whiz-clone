-- 1. Add status enum values and cleanup function
-- First, ensure all required status values exist

-- 2. Create player cleanup function
CREATE OR REPLACE FUNCTION public.reset_players(game_id_in uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all answers for players in this game
  DELETE FROM answers 
  WHERE player_id IN (
    SELECT id FROM players WHERE game_id = game_id_in
  );
  
  -- Delete all players in this game
  DELETE FROM players WHERE game_id = game_id_in;
END;
$$;