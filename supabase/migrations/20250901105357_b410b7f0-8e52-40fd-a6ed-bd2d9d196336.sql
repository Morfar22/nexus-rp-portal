-- Create comprehensive permission system

-- First, let's create a permissions table if it doesn't exist properly
DROP TABLE IF EXISTS public.permissions CASCADE;
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role permissions junction table
DROP TABLE IF EXISTS public.role_permissions CASCADE;
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive permission checking function
CREATE OR REPLACE FUNCTION public.has_permission(
  check_user_id UUID DEFAULT auth.uid(),
  permission_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin bypass (hierarchy 100)
  IF EXISTS (
    SELECT 1 
    FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = check_user_id 
    AND ura.is_active = true 
    AND sr.hierarchy_level >= 100
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission
  IF permission_name IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      JOIN staff_roles sr ON ura.role_id = sr.id
      JOIN role_permissions rp ON sr.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ura.user_id = check_user_id
      AND ura.is_active = true
      AND p.name = permission_name
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Create hierarchy level checking function
CREATE OR REPLACE FUNCTION public.has_hierarchy_level(
  check_user_id UUID DEFAULT auth.uid(),
  min_level INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = check_user_id 
    AND ura.is_active = true 
    AND sr.hierarchy_level >= min_level
  );
END;
$$;

-- Insert comprehensive permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
-- User Management
('users.view', 'View Users', 'View user profiles and information', 'user_management'),
('users.edit', 'Edit Users', 'Edit user profiles and information', 'user_management'),
('users.ban', 'Ban Users', 'Ban and unban users', 'user_management'),
('users.delete', 'Delete Users', 'Delete user accounts', 'user_management'),
('users.force_logout', 'Force Logout', 'Force logout users from all sessions', 'user_management'),
('users.reset_password', 'Reset Password', 'Reset user passwords', 'user_management'),

-- Application Management
('applications.view', 'View Applications', 'View all applications', 'applications'),
('applications.review', 'Review Applications', 'Accept/reject applications', 'applications'),
('applications.delete', 'Delete Applications', 'Delete applications', 'applications'),
('applications.types_manage', 'Manage Application Types', 'Create and edit application types', 'applications'),

-- Content Management
('rules.manage', 'Manage Rules', 'Create, edit, and delete server rules', 'content'),
('laws.manage', 'Manage Laws', 'Create, edit, and delete server laws', 'content'),
('partners.manage', 'Manage Partners', 'Manage server partners', 'content'),
('packages.manage', 'Manage Packages', 'Manage subscription packages', 'content'),
('homepage.manage', 'Manage Homepage', 'Edit homepage content', 'content'),

-- Staff Management
('staff.view', 'View Staff', 'View staff members and roles', 'staff_management'),
('staff.manage_roles', 'Manage Staff Roles', 'Create and edit staff roles', 'staff_management'),
('staff.assign_roles', 'Assign Staff Roles', 'Assign roles to staff members', 'staff_management'),
('staff.remove_roles', 'Remove Staff Roles', 'Remove roles from staff members', 'staff_management'),

-- System Management
('server.manage', 'Manage Servers', 'Manage server configurations', 'system'),
('server.view_stats', 'View Server Stats', 'View server statistics', 'system'),
('settings.manage', 'Manage Settings', 'Edit server settings', 'system'),
('logs.view', 'View Logs', 'View system logs', 'system'),
('security.manage', 'Manage Security', 'Manage security settings', 'system'),

-- Communication
('chat.manage', 'Manage Live Chat', 'Manage live chat system', 'communication'),
('emails.manage', 'Manage Email Templates', 'Edit email templates', 'communication'),
('discord.manage', 'Manage Discord Integration', 'Manage Discord bot and settings', 'communication'),

-- Analytics & Reports
('analytics.view', 'View Analytics', 'View system analytics', 'analytics'),
('reports.generate', 'Generate Reports', 'Generate system reports', 'analytics'),

-- Design & Appearance
('design.manage', 'Manage Design', 'Edit site design and themes', 'design'),
('navbar.manage', 'Manage Navigation', 'Edit navigation menu', 'design'),
('social.manage', 'Manage Social Media', 'Manage social media links', 'design');

-- Set up RLS policies for permissions
CREATE POLICY "Staff can view permissions" ON public.permissions
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Super admins can manage permissions" ON public.permissions
  FOR ALL USING (has_hierarchy_level(auth.uid(), 100));

-- Set up RLS policies for role permissions
CREATE POLICY "Staff can view role permissions" ON public.role_permissions
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (has_hierarchy_level(auth.uid(), 80));

-- Update existing table policies to use the new permission system

-- Applications table
DROP POLICY IF EXISTS "Staff can manage applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view all applications" ON public.applications;

CREATE POLICY "Can view applications with permission" ON public.applications
  FOR SELECT USING (has_permission(auth.uid(), 'applications.view'));

CREATE POLICY "Can review applications with permission" ON public.applications
  FOR UPDATE USING (has_permission(auth.uid(), 'applications.review'));

CREATE POLICY "Can delete applications with permission" ON public.applications
  FOR DELETE USING (has_permission(auth.uid(), 'applications.delete'));

-- Application types
DROP POLICY IF EXISTS "Staff can manage application types" ON public.application_types;

CREATE POLICY "Can manage application types with permission" ON public.application_types
  FOR ALL USING (has_permission(auth.uid(), 'applications.types_manage'));

-- Rules table
DROP POLICY IF EXISTS "Staff can manage rules" ON public.rules;

CREATE POLICY "Can manage rules with permission" ON public.rules
  FOR ALL USING (has_permission(auth.uid(), 'rules.manage'));

-- Laws table  
DROP POLICY IF EXISTS "Staff can manage laws" ON public.laws;

CREATE POLICY "Can manage laws with permission" ON public.laws
  FOR ALL USING (has_permission(auth.uid(), 'laws.manage'));

-- Partners table
DROP POLICY IF EXISTS "Staff can manage partners" ON public.partners;

CREATE POLICY "Can manage partners with permission" ON public.partners
  FOR ALL USING (has_permission(auth.uid(), 'partners.manage'));

-- Packages table
DROP POLICY IF EXISTS "Staff can manage packages" ON public.packages;

CREATE POLICY "Can manage packages with permission" ON public.packages
  FOR ALL USING (has_permission(auth.uid(), 'packages.manage'));

-- Profiles table (user management)
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update user ban status" ON public.profiles;
DROP POLICY IF EXISTS "Staff can delete profiles" ON public.profiles;

CREATE POLICY "Can view users with permission" ON public.profiles
  FOR SELECT USING (
    (auth.uid() = id) OR has_permission(auth.uid(), 'users.view')
  );

CREATE POLICY "Can edit users with permission" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id) OR has_permission(auth.uid(), 'users.edit')
  );

CREATE POLICY "Can delete users with permission" ON public.profiles
  FOR DELETE USING (has_permission(auth.uid(), 'users.delete'));

-- Servers table
DROP POLICY IF EXISTS "Staff can manage servers" ON public.servers;
DROP POLICY IF EXISTS "Staff can view all servers" ON public.servers;

CREATE POLICY "Can view servers with permission" ON public.servers
  FOR SELECT USING (
    is_active = true OR has_permission(auth.uid(), 'server.view_stats')
  );

CREATE POLICY "Can manage servers with permission" ON public.servers
  FOR ALL USING (has_permission(auth.uid(), 'server.manage'));

-- Server settings
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Staff can view server settings" ON public.server_settings;

CREATE POLICY "Can view server settings with permission" ON public.server_settings
  FOR SELECT USING (has_permission(auth.uid(), 'settings.manage'));

CREATE POLICY "Can manage server settings with permission" ON public.server_settings
  FOR ALL USING (has_permission(auth.uid(), 'settings.manage'));

-- Server stats
DROP POLICY IF EXISTS "Staff can manage server stats" ON public.server_stats;

CREATE POLICY "Can manage server stats with permission" ON public.server_stats
  FOR ALL USING (has_permission(auth.uid(), 'server.view_stats'));

-- Individual server stats
DROP POLICY IF EXISTS "Staff can manage individual server stats" ON public.individual_server_stats;

CREATE POLICY "Can manage individual server stats with permission" ON public.individual_server_stats
  FOR ALL USING (has_permission(auth.uid(), 'server.view_stats'));

-- Staff roles table
DROP POLICY IF EXISTS "Super admin hierarchy can manage staff roles" ON public.staff_roles;

CREATE POLICY "Can manage staff roles with permission" ON public.staff_roles
  FOR ALL USING (has_permission(auth.uid(), 'staff.manage_roles'));

-- Chat related tables
DROP POLICY IF EXISTS "Staff can manage chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Staff can view all chat sessions" ON public.chat_sessions;

CREATE POLICY "Can manage chat sessions with permission" ON public.chat_sessions
  FOR ALL USING (has_permission(auth.uid(), 'chat.manage'));

-- Email templates
DROP POLICY IF EXISTS "Staff can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Staff can view email templates" ON public.email_templates;

CREATE POLICY "Can manage email templates with permission" ON public.email_templates
  FOR ALL USING (has_permission(auth.uid(), 'emails.manage'));

-- Audit logs
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;

CREATE POLICY "Can view audit logs with permission" ON public.audit_logs
  FOR SELECT USING (has_permission(auth.uid(), 'logs.view'));

-- Create default role permissions for common roles
-- This will need to be done after roles are created, but here's the structure