-- Add foreign key constraint between team_members and staff_roles
ALTER TABLE public.team_members 
ADD CONSTRAINT fk_team_members_staff_role 
FOREIGN KEY (staff_role_id) REFERENCES public.staff_roles(id);

-- Insert some default staff roles if the table is empty
INSERT INTO public.staff_roles (display_name, color, hierarchy_level) 
VALUES
  ('Founder', '#FFD700', 1),
  ('Co-Owner', '#FFA500', 2),  
  ('Admin', '#FF6B6B', 10),
  ('Developer', '#4ECDC4', 15),
  ('Head Moderator', '#45B7D1', 20),
  ('Senior Moderator', '#96CEB4', 25),
  ('Moderator', '#FECA57', 30),
  ('Helper', '#48CAE4', 40),
  ('Staff', '#A8E6CF', 50)
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles);