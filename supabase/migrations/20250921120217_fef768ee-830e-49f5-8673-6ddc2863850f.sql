-- Fix applications table RLS policies
DROP POLICY IF EXISTS "Anyone can create applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can update applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view applications based on their roles" ON public.applications;

-- Allow anyone to create applications (they must be logged in)
CREATE POLICY "Authenticated users can create applications" ON public.applications
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications" ON public.applications
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow staff to view all applications
CREATE POLICY "Staff can view all applications" ON public.applications
FOR SELECT 
USING (is_staff(auth.uid()));

-- Allow staff to update applications
CREATE POLICY "Staff can update applications" ON public.applications
FOR UPDATE 
USING (is_staff(auth.uid()));

-- Allow staff to delete applications
CREATE POLICY "Staff can delete applications" ON public.applications
FOR DELETE 
USING (is_staff(auth.uid()));

-- Fix application_types table policies
DROP POLICY IF EXISTS "Allow application type management" ON public.application_types;
DROP POLICY IF EXISTS "Anyone can view active application types" ON public.application_types;
DROP POLICY IF EXISTS "Public can view active application types" ON public.application_types;

-- Anyone can view active application types (for the application form)
CREATE POLICY "Anyone can view active application types" ON public.application_types
FOR SELECT 
USING (is_active = true);

-- Only staff can manage application types
CREATE POLICY "Staff can manage application types" ON public.application_types
FOR ALL 
USING (is_staff(auth.uid()));