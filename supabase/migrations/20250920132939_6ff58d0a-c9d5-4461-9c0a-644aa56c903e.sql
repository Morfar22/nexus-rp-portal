-- Fix the Super Administrator permissions issue
-- First, clear any existing permissions for super_admin role to avoid conflicts
DELETE FROM role_permissions WHERE role_id = '11111111-1111-1111-1111-111111111111';

-- Now assign ALL permissions to Super Administrator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id 
FROM permissions;

-- Verify the assignment worked
SELECT COUNT(*) as permissions_assigned FROM role_permissions 
WHERE role_id = '11111111-1111-1111-1111-111111111111';