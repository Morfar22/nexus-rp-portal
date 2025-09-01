-- Create staff_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  hierarchy_level INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  staff_role_id UUID REFERENCES public.staff_roles(id),
  bio TEXT,
  image_url TEXT,
  location TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_roles
CREATE POLICY "Anyone can view active staff roles" 
ON public.staff_roles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage staff roles" 
ON public.staff_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff')
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff') 
    AND banned = false
  )
);

-- Create RLS policies for team_members
CREATE POLICY "Anyone can view active team members" 
ON public.team_members 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff')
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff') 
    AND banned = false
  )
);

-- Insert some default staff roles
INSERT INTO public.staff_roles (display_name, color, hierarchy_level) VALUES
('Founder', '#FFD700', 1),
('Co-Owner', '#FFA500', 2),  
('Admin', '#FF6B6B', 10),
('Developer', '#4ECDC4', 15),
('Head Moderator', '#45B7D1', 20),
('Senior Moderator', '#96CEB4', 25),
('Moderator', '#FECA57', 30),
('Helper', '#48CAE4', 40),
('Staff', '#A8E6CF', 50)
ON CONFLICT DO NOTHING;

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_roles_updated_at
    BEFORE UPDATE ON public.staff_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();