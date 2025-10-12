-- Fix the foreign key constraint to point to custom_users instead of auth.users
ALTER TABLE user_role_assignments DROP CONSTRAINT IF EXISTS user_role_assignments_user_id_fkey;

-- Add new foreign key constraint pointing to custom_users
ALTER TABLE user_role_assignments 
ADD CONSTRAINT user_role_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;

-- Now create the sample role assignment
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
VALUES (
  '5027696b-aa78-4d31-84c6-a94ee5940f5f'::uuid,
  '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  NOW(),
  true
);