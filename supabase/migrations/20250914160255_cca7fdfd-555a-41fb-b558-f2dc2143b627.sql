-- Enable social media platforms and set up default URLs
INSERT INTO public.server_settings (setting_key, setting_value) VALUES (
  'social_media_settings',
  '{
    "instagram_enabled": true,
    "instagram_url": "https://instagram.com/adventurerp",
    "facebook_enabled": true,
    "facebook_url": "https://facebook.com/adventurerp",
    "tiktok_enabled": true,
    "tiktok_url": "https://tiktok.com/@adventurerp",
    "youtube_enabled": true,
    "youtube_url": "https://youtube.com/@adventurerp",
    "show_in_footer": true,
    "show_in_hero": true,
    "animation_enabled": true
  }'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();