-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can create email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can update email templates" ON email_templates;
DROP POLICY IF EXISTS "Admin users can delete email templates" ON email_templates;

-- Create comprehensive RLS policies for email_templates
CREATE POLICY "Admin users can view email templates"
ON email_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM custom_users
    WHERE custom_users.id = auth.uid()
    AND custom_users.role = 'admin'
    AND custom_users.banned = false
  )
);

CREATE POLICY "Admin users can create email templates"
ON email_templates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users
    WHERE custom_users.id = auth.uid()
    AND custom_users.role = 'admin'
    AND custom_users.banned = false
  )
);

CREATE POLICY "Admin users can update email templates"
ON email_templates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM custom_users
    WHERE custom_users.id = auth.uid()
    AND custom_users.role = 'admin'
    AND custom_users.banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users
    WHERE custom_users.id = auth.uid()
    AND custom_users.role = 'admin'
    AND custom_users.banned = false
  )
);

CREATE POLICY "Admin users can delete email templates"
ON email_templates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM custom_users
    WHERE custom_users.id = auth.uid()
    AND custom_users.role = 'admin'
    AND custom_users.banned = false
  )
);