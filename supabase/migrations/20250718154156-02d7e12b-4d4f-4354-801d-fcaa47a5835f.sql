-- Update games table to allow anonymous game creation
ALTER TABLE public.games ALTER COLUMN host_id DROP NOT NULL;

-- Update RLS policies for games table to allow anonymous game creation
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Hosts can update their own games" ON public.games;
DROP POLICY IF EXISTS "Hosts can delete their own games" ON public.games;

CREATE POLICY "Anyone can create games" 
ON public.games 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Game hosts can update their games" 
ON public.games 
FOR UPDATE 
USING (
  (auth.uid() = host_id) OR 
  (host_id IS NULL AND auth.uid() IS NULL) OR
  (auth.uid() IS NULL)
);

CREATE POLICY "Game hosts can delete their games" 
ON public.games 
FOR DELETE 
USING (
  (auth.uid() = host_id) OR 
  (host_id IS NULL AND auth.uid() IS NULL) OR
  (auth.uid() IS NULL)
);