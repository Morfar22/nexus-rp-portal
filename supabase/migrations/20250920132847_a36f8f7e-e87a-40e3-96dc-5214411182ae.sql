-- Ensure emilfrobergww@gmail.com has admin role in custom_users table
UPDATE custom_users 
SET role = 'admin', 
    updated_at = now()
WHERE email = 'emilfrobergww@gmail.com';

-- Ensure the user has an active Super Administrator role assignment
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
VALUES ('5027696b-aa78-4d31-84c6-a94ee5940f5f', '11111111-1111-1111-1111-111111111111', now(), true)
ON CONFLICT (user_id, role_id) DO UPDATE SET 
  is_active = true,
  assigned_at = now();