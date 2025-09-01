-- Create default roles with proper permissions
-- First, let's ensure we have all the permissions we need

-- Insert missing permissions if they don't exist
INSERT INTO permissions (name, display_name, description, category) VALUES
('staff.view', 'Access Staff Panel', 'Access to the staff administration panel', 'staff'),
('users.manage', 'Manage Users', 'Full user management including ban/unban/delete', 'users'),
('users.view', 'View Users', 'View user profiles and information', 'users'),
('users.edit', 'Edit Users', 'Edit user profiles and basic information', 'users'),
('users.delete', 'Delete Users', 'Delete user accounts permanently', 'users'),
('roles.manage', 'Manage Roles', 'Create, edit, and delete staff roles', 'roles'),
('roles.assign', 'Assign Roles', 'Assign and remove roles from users', 'roles'),
('settings.manage', 'Manage Settings', 'Access and modify system settings', 'settings'),
('content.manage', 'Manage Content', 'Manage website content and pages', 'content'),
('moderation.basic', 'Basic Moderation', 'Basic content moderation capabilities', 'moderation'),
('moderation.advanced', 'Advanced Moderation', 'Advanced moderation with user discipline', 'moderation'),
('system.admin', 'System Administration', 'Full system administration access', 'system')
ON CONFLICT (name) DO NOTHING;

-- Ensure our main roles exist with updated permissions
INSERT INTO staff_roles (id, name, display_name, description, color, hierarchy_level, is_active) VALUES
('admin-role-id', 'admin', 'Administrator', 'Full system access with all permissions', '#dc2626', 100, true),
('staff-role-id', 'staff', 'Staff Member', 'General staff access with content and user management', '#2563eb', 70, true),
('moderator-role-id', 'moderator', 'Moderator', 'Community moderation and basic admin functions', '#059669', 50, true),
('support-role-id', 'support', 'Support Staff', 'Customer support and basic user assistance', '#d97706', 30, true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  hierarchy_level = EXCLUDED.hierarchy_level,
  is_active = EXCLUDED.is_active;

-- Assign permissions to roles
-- First clear existing assignments for our roles
DELETE FROM role_permissions WHERE role_id IN ('admin-role-id', 'staff-role-id', 'moderator-role-id', 'support-role-id');

-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin-role-id', id FROM permissions;

-- Staff gets most permissions except system admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'staff-role-id', p.id 
FROM permissions p 
WHERE p.name NOT IN ('system.admin', 'users.delete', 'roles.manage');

-- Moderator gets moderation and basic user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'moderator-role-id', p.id 
FROM permissions p 
WHERE p.name IN (
  'staff.view', 'users.view', 'users.edit', 'moderation.basic', 'moderation.advanced',
  'content.manage', 'chat.manage', 'applications.view', 'applications.review'
);

-- Support gets basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'support-role-id', p.id 
FROM permissions p 
WHERE p.name IN (
  'staff.view', 'users.view', 'chat.manage', 'applications.view'
);