-- Create application-specific permissions if they don't exist
INSERT INTO permissions (name, display_name, description, category)
VALUES 
  ('applications.view', 'View Applications', 'Can view all applications', 'applications'),
  ('applications.review', 'Review Applications', 'Can approve/reject applications', 'applications'),
  ('applications.delete', 'Delete Applications', 'Can delete applications', 'applications'),
  ('applications.types_manage', 'Manage Application Types', 'Can create/edit/delete application types', 'applications')
ON CONFLICT (name) DO NOTHING;

-- Create application-specific staff roles
INSERT INTO staff_roles (name, display_name, description, color, hierarchy_level)
VALUES 
  ('application_viewer', 'Application Viewer', 'Can view all applications', '#3b82f6', 20),
  ('application_reviewer', 'Application Reviewer', 'Can view and review applications', '#10b981', 30),
  ('application_manager', 'Application Manager', 'Full access to application management', '#8b5cf6', 40)
ON CONFLICT (name) DO NOTHING;

-- Link permissions to roles
-- Application Viewer gets view permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT sr.id, p.id 
FROM staff_roles sr
CROSS JOIN permissions p
WHERE sr.name = 'application_viewer' AND p.name = 'applications.view'
ON CONFLICT DO NOTHING;

-- Application Reviewer gets view and review permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT sr.id, p.id 
FROM staff_roles sr
CROSS JOIN permissions p
WHERE sr.name = 'application_reviewer' AND p.name IN ('applications.view', 'applications.review')
ON CONFLICT DO NOTHING;

-- Application Manager gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT sr.id, p.id 
FROM staff_roles sr
CROSS JOIN permissions p
WHERE sr.name = 'application_manager' AND p.name IN ('applications.view', 'applications.review', 'applications.delete', 'applications.types_manage')
ON CONFLICT DO NOTHING;

-- Update RLS policy for applications table to check permissions
DROP POLICY IF EXISTS "Users with permission can view applications" ON applications;
CREATE POLICY "Users with permission can view applications"
ON applications
FOR SELECT
USING (
  has_permission(auth.uid(), 'applications.view') OR
  is_staff(auth.uid()) OR
  (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM custom_users cu
    WHERE cu.role IN ('admin', 'staff', 'moderator') AND cu.banned = false
  ))
);