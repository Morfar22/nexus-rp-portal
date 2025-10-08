-- Drop the existing foreign key constraint
ALTER TABLE public.supporters 
DROP CONSTRAINT IF EXISTS supporters_user_id_fkey;

-- Add the correct foreign key to custom_users
ALTER TABLE public.supporters 
ADD CONSTRAINT supporters_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.custom_users(id) 
ON DELETE CASCADE;