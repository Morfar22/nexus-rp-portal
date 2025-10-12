-- Drop the existing foreign key constraint that points to auth.users
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_fkey;

-- Add new foreign key constraint that points to custom_users
ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.custom_users(id) ON DELETE CASCADE;