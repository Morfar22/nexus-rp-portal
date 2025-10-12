-- SECURITY ENHANCEMENT: Reduce auth OTP expiry to recommended threshold
-- Issue: OTP expiry exceeds recommended threshold (currently likely 24 hours, should be shorter)

-- Update auth configuration to use shorter OTP expiry (1 hour = 3600 seconds)
UPDATE auth.config 
SET value = '3600'
WHERE key = 'OTP_EXPIRY';

-- If the config doesn't exist, insert it
INSERT INTO auth.config (key, value) 
SELECT 'OTP_EXPIRY', '3600'
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE key = 'OTP_EXPIRY');

-- Also ensure email verification has reasonable expiry (24 hours max)
UPDATE auth.config 
SET value = '86400'  -- 24 hours in seconds
WHERE key = 'SIGNUP_EMAIL_CONFIRM_EXPIRY';

INSERT INTO auth.config (key, value) 
SELECT 'SIGNUP_EMAIL_CONFIRM_EXPIRY', '86400'
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE key = 'SIGNUP_EMAIL_CONFIRM_EXPIRY');

-- Verify the auth configuration
SELECT key, value, 
  CASE 
    WHEN key = 'OTP_EXPIRY' AND value::int <= 3600 THEN '✅ Secure (≤1 hour)'
    WHEN key = 'OTP_EXPIRY' AND value::int > 3600 THEN '⚠️ Long expiry (' || (value::int/3600)::text || ' hours)'
    WHEN key = 'SIGNUP_EMAIL_CONFIRM_EXPIRY' AND value::int <= 86400 THEN '✅ Reasonable (≤24 hours)'
    WHEN key = 'SIGNUP_EMAIL_CONFIRM_EXPIRY' AND value::int > 86400 THEN '⚠️ Very long (' || (value::int/86400)::text || ' days)'
    ELSE '✅ Config set'
  END as security_status
FROM auth.config 
WHERE key IN ('OTP_EXPIRY', 'SIGNUP_EMAIL_CONFIRM_EXPIRY')
ORDER BY key;