-- Try to resolve SECURITY DEFINER issues by converting less critical functions
-- Focus on functions that might not need elevated privileges

-- Convert update_updated_at_column to regular function (used in triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Convert the push subscription update trigger to regular function
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Keep upsert_push_subscription as SECURITY DEFINER since it needs to bypass RLS

-- Verify the changes
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'REGULAR'
  END as function_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('update_updated_at_column', 'update_push_subscriptions_updated_at', 'upsert_push_subscription')
ORDER BY proname;