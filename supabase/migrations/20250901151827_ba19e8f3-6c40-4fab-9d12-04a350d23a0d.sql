-- Create staff roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  hierarchy_level INTEGER NOT NULL DEFAULT 50,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (if not already enabled)
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for staff_roles
DROP POLICY IF EXISTS "Anyone can view active staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Staff can manage staff roles" ON public.staff_roles;

CREATE POLICY "Anyone can view active staff roles" 
ON public.staff_roles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage staff roles" 
ON public.staff_roles 
FOR ALL 
USING (has_permission(auth.uid(), 'staff.manage'::text));

-- Clear existing roles and insert the predefined Danish roles
DELETE FROM public.staff_roles;

INSERT INTO public.staff_roles (name, display_name, color, hierarchy_level, description) VALUES
('projekt_leder', 'Projekt Leder', '#ff6b35', 5, 'Leder af større projekter og initiativer'),
('projekt_manager', 'Projekt Manager', '#ff8c42', 10, 'Manager af specifikke projekter'),
('community_manager', 'Community Manager', '#ffd23f', 15, 'Ansvarlig for community engagement og events'),
('head_admin', 'Head Admin', '#ee6055', 20, 'Øverste administrator med fuld adgang'),
('admin', 'Admin', '#ff9999', 25, 'Administrator med udvidet adgang'),
('supporter', 'Supporter', '#60d394', 40, 'Hjælper spillere og modererer chat'),
('proeve_supporter', 'Prøve Supporter', '#aaf683', 45, 'Supporter under træning'),
('allowlist_modtager', 'Allowlist Modtager', '#9561e2', 50, 'Kan modtage og behandle allowlist ansøgninger'),
('head_udvikler', 'Head Udvikler', '#3da5d9', 30, 'Leder af udviklingsteamet'),
('designer', 'Designer', '#73bfb8', 35, 'Ansvarlig for grafisk design og UI/UX'),
('hjaelpe_udvikler', 'Hjælpe Udvikler', '#9cc5a1', 38, 'Assisterer med udvikling og bug fixes');

-- Update team_members table to use staff_role_id
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS staff_role_id UUID REFERENCES public.staff_roles(id);

-- Create trigger for updated_at on staff_roles (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_staff_roles_updated_at ON public.staff_roles;
CREATE TRIGGER update_staff_roles_updated_at BEFORE UPDATE ON public.staff_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();