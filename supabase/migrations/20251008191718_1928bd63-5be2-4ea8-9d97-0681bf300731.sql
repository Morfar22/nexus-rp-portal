-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_data(uuid);

-- Recreate function with Discord information fields
CREATE OR REPLACE FUNCTION public.get_user_data(user_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid, 
   username text, 
   email text, 
   role text, 
   banned boolean, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   full_name text, 
   avatar_url text, 
   banned_at timestamp with time zone, 
   banned_by uuid, 
   email_verified boolean, 
   last_login timestamp with time zone,
   discord_id text,
   discord_username text,
   discord_discriminator text,
   discord_connected_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF user_uuid IS NULL THEN
    -- Return all users when no specific user is requested
    RETURN QUERY 
    SELECT 
      cu.id, cu.username, cu.email, cu.role, cu.banned, cu.created_at, cu.updated_at,
      cu.full_name, cu.avatar_url, cu.banned_at, cu.banned_by, cu.email_verified, cu.last_login,
      cu.discord_id, cu.discord_username, cu.discord_discriminator, cu.discord_connected_at
    FROM custom_users cu
    ORDER BY cu.created_at DESC;
  ELSE
    -- Return specific user
    RETURN QUERY 
    SELECT 
      cu.id, cu.username, cu.email, cu.role, cu.banned, cu.created_at, cu.updated_at,
      cu.full_name, cu.avatar_url, cu.banned_at, cu.banned_by, cu.email_verified, cu.last_login,
      cu.discord_id, cu.discord_username, cu.discord_discriminator, cu.discord_connected_at
    FROM custom_users cu
    WHERE cu.id = user_uuid;
  END IF;
END;
$function$;