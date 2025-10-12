-- Add comprehensive homepage features and CTA content
INSERT INTO public.server_settings (setting_key, setting_value) VALUES
(
  'homepage_features_section', 
  '{
    "title": "Hvorfor Vælge Adventure RP?",
    "description": "Oplev det ultimative GTA V roleplay med professionelle features og aktiv community"
  }'::jsonb
),
(
  'homepage_cta_section',
  '{
    "title": "Klar til at Forme din Fremtid?",
    "description": "Tilslut dig Adventure RP og bliv en del af den mest spændende roleplay community i Danmark. Ansøg om whitelist og start dit eventyr i dag!",
    "features": [
      "Professionelt dansk staff team",
      "Ugentlige events og aktiviteter", 
      "Aktiv Discord community på 500+ medlemmer",
      "Custom scripts og indhold udviklet in-house",
      "Realistisk økonomi og job system"
    ]
  }'::jsonb
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();