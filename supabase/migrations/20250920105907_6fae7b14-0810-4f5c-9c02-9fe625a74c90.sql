-- Give the "Projekt Manager" role all necessary permissions for staff access
-- First find the role ID for "Projekt Manager"
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM staff_roles WHERE display_name = 'Projekt Manager' LIMIT 1) as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name IN (
  'system.admin', 
  'roles.manage', 
  'users.manage', 
  'staff.manage_roles',
  'applications.view',
  'users.view',
  'staff.view'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = (SELECT id FROM staff_roles WHERE display_name = 'Projekt Manager' LIMIT 1)
  AND rp.permission_id = p.id
);