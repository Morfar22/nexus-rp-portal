-- Create a sample role assignment for the current user to demonstrate the system
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
SELECT 
  '5027696b-aa78-4d31-84c6-a94ee5940f5f'::uuid,
  id,
  NOW(),
  true
FROM staff_roles 
WHERE name = 'super_admin' 
LIMIT 1;