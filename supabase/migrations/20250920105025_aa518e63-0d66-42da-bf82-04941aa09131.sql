-- Migrate to custom roles system only
-- Step 1: Create default staff roles if they don't exist

INSERT INTO staff_roles (id, name, display_name, description, color, hierarchy_level, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'super_admin', 'Super Administrator', 'Full system access with all permissions', '#7c3aed', 100, true),
  ('22222222-2222-2222-2222-222222222222', 'admin', 'Administrator', 'Full access to most features', '#dc2626', 90, true),
  ('33333333-3333-3333-3333-333333333333', 'staff', 'Staff Member', 'Access to management features', '#2563eb', 70, true),
  ('44444444-4444-4444-4444-444444444444', 'moderator', 'Moderator', 'Basic moderation permissions', '#059669', 50, true)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Migrate existing users from custom_users.role to user_role_assignments
INSERT INTO user_role_assignments (user_id, role_id, assigned_at, is_active)
SELECT 
  cu.id,
  CASE 
    WHEN cu.role = 'admin' THEN '22222222-2222-2222-2222-222222222222'
    WHEN cu.role = 'staff' THEN '33333333-3333-3333-3333-333333333333'
    WHEN cu.role = 'moderator' THEN '44444444-4444-4444-4444-444444444444'
    ELSE NULL
  END as role_id,
  NOW(),
  true
FROM custom_users cu
WHERE cu.role IN ('admin', 'staff', 'moderator')
AND NOT EXISTS (
  SELECT 1 FROM user_role_assignments ura 
  WHERE ura.user_id = cu.id AND ura.is_active = true
);

-- Step 3: Create a view for backward compatibility with role checking
CREATE OR REPLACE VIEW user_roles_view AS
SELECT 
  cu.id as user_id,
  COALESCE(
    CASE 
      WHEN EXISTS(SELECT 1 FROM user_role_assignments ura JOIN staff_roles sr ON ura.role_id = sr.id 
                  WHERE ura.user_id = cu.id AND ura.is_active = true AND sr.name = 'admin') THEN 'admin'
      WHEN EXISTS(SELECT 1 FROM user_role_assignments ura JOIN staff_roles sr ON ura.role_id = sr.id 
                  WHERE ura.user_id = cu.id AND ura.is_active = true AND sr.name = 'staff') THEN 'staff'
      WHEN EXISTS(SELECT 1 FROM user_role_assignments ura JOIN staff_roles sr ON ura.role_id = sr.id 
                  WHERE ura.user_id = cu.id AND ura.is_active = true AND sr.name = 'moderator') THEN 'moderator'
      ELSE 'user'
    END
  ) as role
FROM custom_users cu;