-- Update the subscription to be active for testing
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'Basic',
  subscription_end = '2025-10-20 10:00:00+00'
WHERE user_id = '5027696b-aa78-4d31-84c6-a94ee5940f5f';