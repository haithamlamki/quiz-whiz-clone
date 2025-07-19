-- Ensure anonymous users can read game status for polling
-- Check if policy already exists and create if needed
DO $$
BEGIN
    -- Check if the policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'games' 
        AND policyname = 'anon read status'
    ) THEN
        -- Create policy for anonymous access to game status
        CREATE POLICY "anon read status"
          ON games FOR SELECT USING (true);
    END IF;
END
$$;