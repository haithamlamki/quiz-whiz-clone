-- Drop the existing function and recreate it with proper permissions
DROP FUNCTION IF EXISTS public.increment_player_score(uuid, integer);

-- Create the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.increment_player_score(player_id_in uuid, score_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.players
  SET score = score + score_to_add
  WHERE id = player_id_in;
END;
$function$;

-- Also add a policy to allow updates to player scores during gameplay
DROP POLICY IF EXISTS "Allow score updates during gameplay" ON public.players;
CREATE POLICY "Allow score updates during gameplay" 
ON public.players 
FOR UPDATE 
USING (true);