-- Create a function to generate unique game PINs
CREATE OR REPLACE FUNCTION generate_game_pin()
RETURNS TEXT AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-digit PIN
    new_pin := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Check if PIN already exists in games table
    SELECT EXISTS(SELECT 1 FROM games WHERE game_pin = new_pin) INTO pin_exists;
    
    -- If PIN doesn't exist, return it
    IF NOT pin_exists THEN
      RETURN new_pin;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add missing columns to games table for real-time game management
ALTER TABLE games ADD COLUMN IF NOT EXISTS players_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_pin ON games(game_pin);
CREATE INDEX IF NOT EXISTS idx_games_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);

-- Create a function to add a player to a game
CREATE OR REPLACE FUNCTION add_player_to_game(
  p_game_pin TEXT,
  p_player_name TEXT
) RETURNS TABLE(game_id UUID, player_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_game_id UUID;
  v_player_id UUID;
  v_existing_player UUID;
BEGIN
  -- Find the game by PIN
  SELECT id INTO v_game_id FROM games WHERE game_pin = p_game_pin AND is_active = true;
  
  IF v_game_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Game not found or inactive';
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
$$ LANGUAGE plpgsql;

-- Enable realtime for games and players tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;