-- Fix the add_player_to_game function with proper column references
CREATE OR REPLACE FUNCTION public.add_player_to_game(p_game_pin text, p_player_name text)
RETURNS TABLE(game_id uuid, player_id uuid, success boolean, message text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_game_id UUID;
  v_player_id UUID;
  v_existing_player UUID;
BEGIN
  -- Find the game by PIN
  SELECT g.id INTO v_game_id FROM public.games g WHERE g.game_pin = p_game_pin;
  
  IF v_game_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Game not found';
    RETURN;
  END IF;
  
  -- Check if player name already exists in this game (use fully qualified column names)
  SELECT p.id INTO v_existing_player FROM public.players p WHERE p.game_id = v_game_id AND p.name = p_player_name;
  
  IF v_existing_player IS NOT NULL THEN
    RETURN QUERY SELECT v_game_id, v_existing_player, TRUE, 'Player already exists';
    RETURN;
  END IF;
  
  -- Add new player
  INSERT INTO public.players (game_id, name) VALUES (v_game_id, p_player_name) RETURNING id INTO v_player_id;
  
  RETURN QUERY SELECT v_game_id, v_player_id, TRUE, 'Player added successfully';
END;
$function$;

-- Test the function to make sure it works
SELECT * FROM add_player_to_game('169882', 'TestPlayer');