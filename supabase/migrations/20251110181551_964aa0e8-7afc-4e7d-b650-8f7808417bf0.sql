-- Enable RLS on servers table if not already enabled
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for servers table

-- Anyone can view active servers
CREATE POLICY "Anyone can view active servers"
ON servers
FOR SELECT
USING (is_active = true);

-- Staff can view all servers
CREATE POLICY "Staff can view all servers"
ON servers
FOR SELECT
USING (is_staff(auth.uid()));

-- Staff can manage servers
CREATE POLICY "Staff can manage servers"
ON servers
FOR ALL
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));