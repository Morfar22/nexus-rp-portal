-- Create the missing team.manage permission
INSERT INTO permissions (name, display_name, description, category)
VALUES ('team.manage', 'Manage Team', 'Add, edit, and remove team members', 'team');

-- Assign the team.manage permission to the super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id
FROM permissions 
WHERE name = 'team.manage';