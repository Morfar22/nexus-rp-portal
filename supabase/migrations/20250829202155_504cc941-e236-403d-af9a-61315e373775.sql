-- Create RPC function to handle push subscription upserting
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
  p_user_id UUID,
  p_subscription JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO push_subscriptions (user_id, subscription)
  VALUES (p_user_id, p_subscription)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    subscription = p_subscription,
    updated_at = NOW();
END;
$$;