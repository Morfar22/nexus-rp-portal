-- Insert default staff roles with explicit column names only if they don't exist
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
ON CONFLICT (display_name) DO NOTHING;