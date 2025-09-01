-- Add unique constraint on display_name for staff_roles
ALTER TABLE public.staff_roles ADD CONSTRAINT staff_roles_display_name_unique UNIQUE (display_name);

-- Insert default staff roles only if table is empty
INSERT INTO public.staff_roles (display_name, color, hierarchy_level) 
SELECT 'Founder', '#FFD700', 1
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Co-Owner', '#FFA500', 2
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Admin', '#FF6B6B', 10
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Developer', '#4ECDC4', 15
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Head Moderator', '#45B7D1', 20
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Senior Moderator', '#96CEB4', 25
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Moderator', '#FECA57', 30
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Helper', '#48CAE4', 40
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1)
UNION ALL
SELECT 'Staff', '#A8E6CF', 50
WHERE NOT EXISTS (SELECT 1 FROM public.staff_roles LIMIT 1);