-- Add missing DELETE policy for applications table

-- Create a DELETE policy that allows staff to delete applications
CREATE POLICY "Allow application deletion" ON applications
FOR DELETE
USING (
  -- Staff can delete all applications
  is_staff(user_id) OR
  -- Users with permission can delete all
  has_permission(user_id, 'applications.delete')
);