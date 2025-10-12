-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.supporters 
DROP CONSTRAINT IF EXISTS supporters_user_id_fkey;

-- Add new foreign key constraint that references custom_users
ALTER TABLE public.supporters 
ADD CONSTRAINT supporters_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.custom_users(id) 
ON DELETE CASCADE;