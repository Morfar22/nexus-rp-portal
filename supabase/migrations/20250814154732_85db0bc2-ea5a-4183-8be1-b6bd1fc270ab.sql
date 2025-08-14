-- Add foreign key relationship between user_roles and profiles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;