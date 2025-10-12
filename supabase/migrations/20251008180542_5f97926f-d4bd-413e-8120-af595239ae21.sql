-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view non-anonymous supporters" ON public.supporters;
DROP POLICY IF EXISTS "Staff can manage supporters" ON public.supporters;

-- Enable RLS on supporters table
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view non-anonymous supporters
CREATE POLICY "Anyone can view non-anonymous supporters"
ON public.supporters
FOR SELECT
USING (is_anonymous = false OR is_anonymous IS NULL);

-- Allow staff to manage all supporters
CREATE POLICY "Staff can manage supporters"
ON public.supporters
FOR ALL
USING (
  is_staff(auth.uid()) 
  OR (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM custom_users cu 
    WHERE cu.role IN ('admin', 'staff', 'moderator') 
    AND cu.banned = false
  ))
);