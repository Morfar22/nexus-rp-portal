-- Add missing staff.view permission and assign it to admin roles
INSERT INTO permissions (name, display_name, description, category)
VALUES ('staff.view', 'View Staff Panel', 'Access to view the staff management panel', 'staff')
ON CONFLICT (name) DO NOTHING;

-- Assign staff.view permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name = 'staff.view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '22222222-2222-2222-2222-222222222222'::uuid 
  AND rp.permission_id = p.id
);

-- Also assign to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '11111111-1111-1111-1111-111111111111'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name = 'staff.view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '11111111-1111-1111-1111-111111111111'::uuid 
  AND rp.permission_id = p.id
);

-- Also assign to staff role for basic staff access
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid as role_id,
  p.id as permission_id
FROM permissions p
WHERE p.name = 'staff.view'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = '33333333-3333-3333-3333-333333333333'::uuid 
  AND rp.permission_id = p.id
);