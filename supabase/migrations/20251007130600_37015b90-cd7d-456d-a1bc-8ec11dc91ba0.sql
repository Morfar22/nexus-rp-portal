-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active keybinds" ON public.keybinds;
DROP POLICY IF EXISTS "Staff can manage keybinds" ON public.keybinds;

-- Create updated policies that work with custom auth
CREATE POLICY "Anyone can view active keybinds"
  ON public.keybinds
  FOR SELECT
  USING (is_active = true);

-- Allow staff to view all keybinds (including inactive)
CREATE POLICY "Staff can view all keybinds"
  ON public.keybinds
  FOR SELECT
  USING (
    is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM custom_users cu
      WHERE cu.role IN ('admin', 'staff', 'moderator')
      AND cu.banned = false
    )
  );

-- Allow staff to insert keybinds
CREATE POLICY "Staff can insert keybinds"
  ON public.keybinds
  FOR INSERT
  WITH CHECK (
    is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM custom_users cu
      WHERE cu.role IN ('admin', 'staff', 'moderator')
      AND cu.banned = false
    )
  );

-- Allow staff to update keybinds
CREATE POLICY "Staff can update keybinds"
  ON public.keybinds
  FOR UPDATE
  USING (
    is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM custom_users cu
      WHERE cu.role IN ('admin', 'staff', 'moderator')
      AND cu.banned = false
    )
  )
  WITH CHECK (
    is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM custom_users cu
      WHERE cu.role IN ('admin', 'staff', 'moderator')
      AND cu.banned = false
    )
  );

-- Allow staff to delete keybinds
CREATE POLICY "Staff can delete keybinds"
  ON public.keybinds
  FOR DELETE
  USING (
    is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM custom_users cu
      WHERE cu.role IN ('admin', 'staff', 'moderator')
      AND cu.banned = false
    )
  );