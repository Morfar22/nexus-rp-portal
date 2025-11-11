-- Deactivate maintenance mode
UPDATE server_settings 
SET setting_value = jsonb_set(
  setting_value, 
  '{maintenance_mode}', 
  'false'::jsonb
)
WHERE setting_key = 'general_settings';