-- Remove duplicate foreign key constraint
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_staff_role_id_fkey;