-- Enable live chat feature
UPDATE server_settings 
SET setting_value = jsonb_set(setting_value, '{enabled}', 'true'::jsonb) 
WHERE setting_key = 'chat_settings';