-- Assign Emil to the Administrator role with proper permissions
-- First, deactivate his current role assignment
UPDATE user_role_assignments 
SET is_active = false
WHERE user_id = '5027696b-aa78-4d31-84c6-a94ee5940f5f';

-- Assign him to the Administrator role
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, is_active)
VALUES (
  '5027696b-aa78-4d31-84c6-a94ee5940f5f', -- Emil's user ID
  '22222222-2222-2222-2222-222222222222', -- Administrator role ID
  '5027696b-aa78-4d31-84c6-a94ee5940f5f', -- Self-assigned
  true
);