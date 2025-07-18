-- Check and update the add_player_to_game function to handle nullable host_ids
CREATE OR REPLACE FUNCTION public.add_player_to_game(p_game_pin text, p_player_name text)
RETURNS TABLE(game_id uuid, player_id uuid, success boolean, message text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_game_id UUID;
  v_player_id UUID;
  v_existing_player UUID;
BEGIN
  -- Find the game by PIN (removed is_active check since we made host_id nullable)
  SELECT id INTO v_game_id FROM games WHERE game_pin = p_game_pin;
  
  IF v_game_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Game not found';
    RETURN;
  END IF;
  
  -- Check if player name already exists in this game
  SELECT id INTO v_existing_player FROM players WHERE game_id = v_game_id AND name = p_player_name;
  
  IF v_existing_player IS NOT NULL THEN
    RETURN QUERY SELECT v_game_id, v_existing_player, TRUE, 'Player already exists';
    RETURN;
  END IF;
  
  -- Add new player
  INSERT INTO players (game_id, name) VALUES (v_game_id, p_player_name) RETURNING id INTO v_player_id;
  
  RETURN QUERY SELECT v_game_id, v_player_id, TRUE, 'Player added successfully';
END;
$function$;