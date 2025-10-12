-- First, let's just ensure the basic table structure exists
-- Check if staff_roles table has the right columns
DO $$ 
BEGIN
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_roles' AND column_name = 'display_name') THEN
        ALTER TABLE public.staff_roles ADD COLUMN display_name TEXT NOT NULL DEFAULT 'Staff';
    END IF;
    
    -- Add color column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_roles' AND column_name = 'color') THEN
        ALTER TABLE public.staff_roles ADD COLUMN color TEXT NOT NULL DEFAULT '#6b7280';
    END IF;
    
    -- Add hierarchy_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'staff_roles' AND column_name = 'hierarchy_level') THEN
        ALTER TABLE public.staff_roles ADD COLUMN hierarchy_level INTEGER NOT NULL DEFAULT 50;
    END IF;
END $$;

-- Ensure team_members has staff_role_id foreign key
DO $$
BEGIN
    -- Add staff_role_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'staff_role_id') THEN
        ALTER TABLE public.team_members ADD COLUMN staff_role_id UUID REFERENCES public.staff_roles(id);
    END IF;
END $$;