-- Drop all existing policies and create completely open ones for debugging
DROP POLICY IF EXISTS "Temp: All authenticated users can manage servers" ON public.servers;
DROP POLICY IF EXISTS "Temp: All users can view servers" ON public.servers;

-- Make servers table completely open temporarily
CREATE POLICY "Allow all operations on servers" ON public.servers
FOR ALL USING (true) WITH CHECK (true);