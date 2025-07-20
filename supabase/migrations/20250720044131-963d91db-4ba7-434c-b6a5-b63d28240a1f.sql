-- Drop existing restrictive UPDATE policies
DROP POLICY IF EXISTS "Game hosts can update their games" ON public.games;
DROP POLICY IF EXISTS "Hosts can update their own games." ON public.games;

-- Create a permissive UPDATE policy for development/testing
CREATE POLICY "Allow all updates for development" 
ON public.games 
FOR UPDATE 
USING (true);