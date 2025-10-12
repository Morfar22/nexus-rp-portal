-- Give full permissions to emilfrobergww@gmail.com
-- Create or ensure super admin role exists and assign it to the user

-- First, ensure we have a super admin role
INSERT INTO staff_roles (name, display_name, hierarchy_level, description)
VALUES ('super_admin', 'Super Administrator', 100, 'Full system access with all permissions')
ON CONFLICT (name) DO UPDATE SET
  hierarchy_level = 100,
  display_name = 'Super Administrator',
  description = 'Full system access with all permissions';

-- Get the user ID for emilfrobergww@gmail.com
DO $$
DECLARE
  target_user_id uuid;
  super_admin_role_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO target_user_id 
  FROM custom_users 
  WHERE email = 'emilfrobergww@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User emilfrobergww@gmail.com not found';
  END IF;
  
  -- Get the super admin role ID
  SELECT id INTO super_admin_role_id 
  FROM staff_roles 
  WHERE name = 'super_admin';
  
  -- Assign the user to super admin role
  INSERT INTO user_role_assignments (user_id, role_id, is_active, assigned_at)
  VALUES (target_user_id, super_admin_role_id, true, now())
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET 
    is_active = true,
    assigned_at = now();
    
  -- Update the user's role in custom_users table to admin
  UPDATE custom_users 
  SET role = 'admin', updated_at = now()
  WHERE id = target_user_id;
  
  RAISE NOTICE 'Successfully granted super admin permissions to user %', target_user_id;
END $$;