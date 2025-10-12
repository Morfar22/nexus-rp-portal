-- Fix RLS policy recursion by updating the has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(check_user_id uuid DEFAULT NULL::uuid, permission_name text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- If no user ID provided, return false
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and get their role from custom_users
  IF EXISTS (
    SELECT 1 
    FROM custom_users
    WHERE id = check_user_id 
    AND role = 'admin'
    AND NOT banned
  ) THEN
    RETURN TRUE; -- Admin has all permissions
  END IF;

  -- For staff/moderator roles, check specific permissions
  IF permission_name IS NOT NULL THEN
    -- Check if user has staff role and the permission exists
    RETURN EXISTS (
      SELECT 1
      FROM custom_users cu
      WHERE cu.id = check_user_id
      AND cu.role IN ('admin', 'staff', 'moderator')
      AND NOT cu.banned
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- Add essential permissions for staff management
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('users.view', 'View Users', 'View all users in the system', 'User Management'),
  ('users.edit', 'Edit Users', 'Edit user profiles and settings', 'User Management'),
  ('users.ban', 'Ban Users', 'Ban and unban users', 'User Management'),
  ('users.delete', 'Delete Users', 'Delete user accounts', 'User Management'),
  ('staff.view', 'View Staff Panel', 'Access to staff management panel', 'Staff Management'),
  ('chat.manage', 'Manage Chat', 'Manage live chat sessions', 'Chat Management'),
  ('applications.view', 'View Applications', 'View user applications', 'Application Management'),
  ('applications.review', 'Review Applications', 'Review and approve/deny applications', 'Application Management'),
  ('laws.manage', 'Manage Laws', 'Create, edit, and delete laws', 'Content Management'),
  ('packages.manage', 'Manage Packages', 'Manage subscription packages', 'Content Management'),
  ('partners.manage', 'Manage Partners', 'Manage partner listings', 'Content Management'),
  ('server.view_stats', 'View Server Stats', 'View server statistics and analytics', 'Server Management'),
  ('analytics.view', 'View Analytics', 'Access to analytics dashboard', 'Analytics'),
  ('logs.view', 'View Logs', 'View system and audit logs', 'System'),
  ('emails.manage', 'Manage Emails', 'Manage email templates and settings', 'Communication')
ON CONFLICT (name) DO NOTHING;