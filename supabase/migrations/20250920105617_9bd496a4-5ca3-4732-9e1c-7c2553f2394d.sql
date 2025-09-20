-- Add all necessary permissions for admin roles  
-- First, ensure all permissions exist
INSERT INTO permissions (name, display_name, description, category)
VALUES 
  ('roles.manage', 'Manage Roles', 'Create, edit and delete custom roles', 'roles'),
  ('system.admin', 'System Administration', 'Full system administrative access', 'system'),
  ('users.manage', 'Manage Users', 'Manage user accounts and profiles', 'users'),
  ('users.view', 'View Users', 'View user accounts and profiles', 'users'),
  ('staff.manage_roles', 'Manage Staff Roles', 'Assign and remove staff roles', 'staff'),
  ('staff.assign_roles', 'Assign Staff Roles', 'Assign roles to staff members', 'staff')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '22222222-2222-2222-2222-222222222222'::uuid 
  AND rp.permission_id = p.id
);

-- Assign key permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '11111111-1111-1111-1111-111111111111'::uuid 
  AND rp.permission_id = p.id
);

-- Assign basic staff permissions to staff role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name IN ('users.view', 'staff.assign_roles', 'applications.view', 'applications.review')
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '33333333-3333-3333-3333-333333333333'::uuid 
  AND rp.permission_id = p.id
);