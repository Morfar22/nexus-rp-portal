-- Create default roles with proper permissions
-- First, let's ensure we have all the permissions we need

-- Insert missing permissions if they don't exist
INSERT INTO permissions (name, display_name, description, category) VALUES
('staff.view', 'Access Staff Panel', 'Access to the staff administration panel', 'staff'),
('users.manage', 'Manage Users', 'Full user management including ban/unban/delete', 'users'),
('roles.manage', 'Manage Roles', 'Create, edit, and delete staff roles', 'roles'),
('roles.assign', 'Assign Roles', 'Assign and remove roles from users', 'roles'),
('content.manage', 'Manage Content', 'Manage website content and pages', 'content'),
('moderation.basic', 'Basic Moderation', 'Basic content moderation capabilities', 'moderation'),
('moderation.advanced', 'Advanced Moderation', 'Advanced moderation with user discipline', 'moderation'),
('system.admin', 'System Administration', 'Full system administration access', 'system')
ON CONFLICT (name) DO NOTHING;

-- Create default roles if they don't exist (let PostgreSQL generate UUIDs)
DO $$
DECLARE
    admin_role_id UUID;
    staff_role_id UUID;
    moderator_role_id UUID;
    support_role_id UUID;
BEGIN
    -- Insert or update Administrator role
    INSERT INTO staff_roles (name, display_name, description, color, hierarchy_level, is_active) 
    VALUES ('administrator', 'Administrator', 'Full system access with all permissions', '#dc2626', 100, true)
    ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        hierarchy_level = EXCLUDED.hierarchy_level,
        is_active = EXCLUDED.is_active
    RETURNING id INTO admin_role_id;
    
    -- Get the admin role ID if it was already there
    IF admin_role_id IS NULL THEN
        SELECT id INTO admin_role_id FROM staff_roles WHERE name = 'administrator';
    END IF;
    
    -- Insert or update Staff role
    INSERT INTO staff_roles (name, display_name, description, color, hierarchy_level, is_active)
    VALUES ('staff_member', 'Staff Member', 'General staff access with content and user management', '#2563eb', 70, true)
    ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        hierarchy_level = EXCLUDED.hierarchy_level,
        is_active = EXCLUDED.is_active
    RETURNING id INTO staff_role_id;
    
    IF staff_role_id IS NULL THEN
        SELECT id INTO staff_role_id FROM staff_roles WHERE name = 'staff_member';
    END IF;
    
    -- Insert or update Moderator role
    INSERT INTO staff_roles (name, display_name, description, color, hierarchy_level, is_active)
    VALUES ('community_moderator', 'Community Moderator', 'Community moderation and basic admin functions', '#059669', 50, true)
    ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        hierarchy_level = EXCLUDED.hierarchy_level,
        is_active = EXCLUDED.is_active
    RETURNING id INTO moderator_role_id;
    
    IF moderator_role_id IS NULL THEN
        SELECT id INTO moderator_role_id FROM staff_roles WHERE name = 'community_moderator';
    END IF;
    
    -- Insert or update Support role
    INSERT INTO staff_roles (name, display_name, description, color, hierarchy_level, is_active)
    VALUES ('support_staff', 'Support Staff', 'Customer support and basic user assistance', '#d97706', 30, true)
    ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        color = EXCLUDED.color,
        hierarchy_level = EXCLUDED.hierarchy_level,
        is_active = EXCLUDED.is_active
    RETURNING id INTO support_role_id;
    
    IF support_role_id IS NULL THEN
        SELECT id INTO support_role_id FROM staff_roles WHERE name = 'support_staff';
    END IF;
    
    -- Clear existing role permissions for these roles
    DELETE FROM role_permissions WHERE role_id IN (admin_role_id, staff_role_id, moderator_role_id, support_role_id);
    
    -- Admin gets ALL permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT admin_role_id, id FROM permissions;
    
    -- Staff gets most permissions except system admin and role management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT staff_role_id, p.id 
    FROM permissions p 
    WHERE p.name NOT IN ('system.admin', 'users.delete', 'roles.manage');
    
    -- Moderator gets moderation and basic user management
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT moderator_role_id, p.id 
    FROM permissions p 
    WHERE p.name IN (
        'staff.view', 'users.view', 'users.edit', 'moderation.basic', 'moderation.advanced',
        'content.manage', 'chat.manage', 'applications.view', 'applications.review'
    );
    
    -- Support gets basic permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT support_role_id, p.id 
    FROM permissions p 
    WHERE p.name IN (
        'staff.view', 'users.view', 'chat.manage', 'applications.view'
    );
END $$;