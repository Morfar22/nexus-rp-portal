-- Simple fix: just ensure team_members table has basic read access
-- Don't touch the complex function dependencies

-- Check if team_members table exists and has the right structure
-- Just add a simple public read policy if it doesn't exist already

DO $$ 
BEGIN
    -- Try to create the policy, ignore if it already exists
    BEGIN
        EXECUTE 'CREATE POLICY "Public read team members simple" ON public.team_members FOR SELECT USING (true)';
        RAISE NOTICE 'Created new public read policy for team_members';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Public read policy already exists for team_members';
    END;
END $$;