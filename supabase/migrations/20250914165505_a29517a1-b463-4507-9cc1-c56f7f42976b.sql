-- Fix potential SECURITY DEFINER view issue by recreating the team_members_public view
-- The linter might be detecting an issue with how the view was created

-- Drop and recreate the view to ensure it doesn't have SECURITY DEFINER properties
DROP VIEW IF EXISTS public.team_members_public;

-- Recreate the view as a standard view (not SECURITY DEFINER)
CREATE VIEW public.team_members_public AS
SELECT 
  id,
  name,
  role,
  bio,
  image_url,
  location,
  order_index,
  is_active,
  created_at,
  staff_role_id
FROM public.team_members
WHERE is_active = true;

-- Grant appropriate permissions
GRANT SELECT ON public.team_members_public TO anon, authenticated;

-- Add comment
COMMENT ON VIEW public.team_members_public IS 'Public view of active team members with safe columns only';

-- Verify no SECURITY DEFINER objects remain that could cause issues
SELECT 
  'VIEW' as object_type,
  viewname as name,
  'N/A' as is_security_definer
FROM pg_views 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'FUNCTION' as object_type,
  proname as name,
  CASE WHEN prosecdef THEN 'YES' ELSE 'NO' END as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prosecdef = true
ORDER BY object_type, name;