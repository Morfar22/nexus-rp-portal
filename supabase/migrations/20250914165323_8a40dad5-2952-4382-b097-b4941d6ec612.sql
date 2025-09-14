-- CRITICAL SECURITY FIX: Remove deprecated SECURITY DEFINER functions
-- Issue: Deprecated analytics_query functions with SECURITY DEFINER pose security risk

-- Drop the deprecated analytics_query functions that are marked as deprecated
-- These functions just return empty arrays and don't need elevated privileges

-- Drop the text parameter version (deprecated)
DROP FUNCTION IF EXISTS public.analytics_query(text);

-- Drop the jsonb parameter version (also deprecated and has permission issues)  
DROP FUNCTION IF EXISTS public.analytics_query(jsonb);

-- Create a simple non-SECURITY DEFINER replacement if needed (optional)
CREATE OR REPLACE FUNCTION public.analytics_query_deprecated()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  -- This function is deprecated - use edge functions for analytics
  SELECT '[]'::jsonb;
$$;

-- Add comment to indicate deprecation
COMMENT ON FUNCTION public.analytics_query_deprecated() IS 'Deprecated function - use analytics edge functions instead';

-- Verify remaining SECURITY DEFINER functions are legitimate
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN proname IN ('check_user_permission', 'get_user_role', 'has_permission', 'has_hierarchy_level', 'has_admin_hierarchy', 'has_super_admin_hierarchy', 'is_staff', 'check_missed_chats', 'update_push_subscriptions_updated_at', 'upsert_push_subscription', 'get_user_supporter_status', 'calculate_supporter_tier', 'get_all_permissions_for_admin', 'update_updated_at_column', 'handle_new_user', 'log_analytics_event', 'has_role', 'get_current_user_role', 'is_admin', 'is_moderator_or_above') 
    THEN '✅ Legitimate SECURITY DEFINER usage' 
    ELSE '⚠️ Review this function'
  END as security_status
FROM pg_proc 
WHERE prosecdef = true 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;