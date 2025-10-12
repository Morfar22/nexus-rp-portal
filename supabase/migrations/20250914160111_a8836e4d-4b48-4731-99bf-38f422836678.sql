-- Add comprehensive homepage features to improve the website content

-- First insert the homepage features section configuration
INSERT INTO public.server_settings (setting_key, setting_value, created_by) VALUES
(
    'homepage_features_section',
    '{"title": "Hvorfor Vælge Adventure RP?", "description": "Oplev den ultimative FiveM roleplay server med professionelt staff, unikke features og en voksende community"}',
    (SELECT id FROM custom_users WHERE role = 'admin' LIMIT 1)
) 
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '{"title": "Hvorfor Vælge Adventure RP?", "description": "Oplev den ultimative FiveM roleplay server med professionelt staff, unikke features og en voksende community"}',
    updated_at = now();

-- Add comprehensive homepage features
INSERT INTO public.server_settings (setting_key, setting_value, created_by) VALUES
(
    'homepage_features',
    '[
        {
            "title": "Professionelt Staff",
            "description": "Vårt erfarne team sikrer fair gameplay og hjælper nye spillere med at komme i gang",
            "icon": "Shield",
            "color": "text-neon-teal"
        },
        {
            "title": "Custom Scripts",
            "description": "Unikke scripts og systemer udviklet specielt til vores server for den bedste oplevelse",
            "icon": "Code",
            "color": "text-neon-purple"
        },
        {
            "title": "Aktiv Community",
            "description": "Voksende fællesskab med daglige events, konkurrencer og roleplay muligheder",
            "icon": "Users",
            "color": "text-neon-gold"
        },
        {
            "title": "Realistisk Økonomi",
            "description": "Balanceret økonomi system med jobs, forretninger og investeringsmuligheder",
            "icon": "DollarSign",
            "color": "text-golden-light"
        },
        {
            "title": "Custom Køretøjer",
            "description": "Stor samling af håndplukkede køretøjer med realistiske handling og lyde",
            "icon": "Car",
            "color": "text-teal-primary"
        },
        {
            "title": "Whitelist System",
            "description": "Kvalitetssikret community gennem vores omhyggelige whitelist proces",
            "icon": "UserCheck",
            "color": "text-neon-blue"
        }
    ]',
    (SELECT id FROM custom_users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '[
        {
            "title": "Professionelt Staff",
            "description": "Vårt erfarne team sikrer fair gameplay og hjælper nye spillere med at komme i gang",
            "icon": "Shield",
            "color": "text-neon-teal"
        },
        {
            "title": "Custom Scripts",
            "description": "Unikke scripts og systemer udviklet specielt til vores server for den bedste oplevelse",
            "icon": "Code",
            "color": "text-neon-purple"
        },
        {
            "title": "Aktiv Community",
            "description": "Voksende fællesskab med daglige events, konkurrencer og roleplay muligheder",
            "icon": "Users",
            "color": "text-neon-gold"
        },
        {
            "title": "Realistisk Økonomi",
            "description": "Balanceret økonomi system med jobs, forretninger og investeringsmuligheder",
            "icon": "DollarSign",
            "color": "text-golden-light"
        },
        {
            "title": "Custom Køretøjer",
            "description": "Stor samling af håndplukkede køretøjer med realistiske handling og lyde",
            "icon": "Car",
            "color": "text-teal-primary"
        },
        {
            "title": "Whitelist System",
            "description": "Kvalitetssikret community gennem vores omhyggelige whitelist proces",
            "icon": "UserCheck",
            "color": "text-neon-blue"
        }
    ]',
    updated_at = now();

-- Improve the CTA section content
INSERT INTO public.server_settings (setting_key, setting_value, created_by) VALUES
(
    'homepage_cta_section',
    '{
        "title": "Klar til at Starte dit Eventyr?",
        "description": "Bliv en del af Adventure RP fællesskabet og oplev den bedste FiveM roleplay server. Vores whitelist proces sikrer kvalitet og seriøsitet.",
        "features": [
            "Professionelt staff team tilgængeligt 24/7",
            "Ugentlige updates og nye features",
            "Aktiv Discord community med 1000+ medlemmer",
            "Realtime support og hjælp til nye spillere",
            "Events og konkurrencer hver weekend"
        ]
    }',
    (SELECT id FROM custom_users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '{
        "title": "Klar til at Starte dit Eventyr?",
        "description": "Bliv en del af Adventure RP fællesskabet og oplev den bedste FiveM roleplay server. Vores whitelist proces sikrer kvalitet og seriøsitet.",
        "features": [
            "Professionelt staff team tilgængeligt 24/7",
            "Ugentlige updates og nye features",
            "Aktiv Discord community med 1000+ medlemmer",
            "Realtime support og hjælp til nye spillere",
            "Events og konkurrencer hver weekend"
        ]
    }',
    updated_at = now();

-- Update social media settings to enable more platforms
INSERT INTO public.server_settings (setting_key, setting_value, created_by) VALUES
(
    'social_media_settings',
    '{
        "instagram_enabled": true,
        "instagram_url": "https://instagram.com/adventurerp_dk",
        "facebook_enabled": true,
        "facebook_url": "https://facebook.com/adventurerp",
        "tiktok_enabled": true,
        "tiktok_url": "https://tiktok.com/@adventurerp",
        "youtube_enabled": true,
        "youtube_url": "https://youtube.com/@adventurerp",
        "show_in_footer": true,
        "show_in_hero": true,
        "animation_enabled": true
    }',
    (SELECT id FROM custom_users WHERE role = 'admin' LIMIT 1)
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
    setting_value = '{
        "instagram_enabled": true,
        "instagram_url": "https://instagram.com/adventurerp_dk",
        "facebook_enabled": true,
        "facebook_url": "https://facebook.com/adventurerp",
        "tiktok_enabled": true,
        "tiktok_url": "https://tiktok.com/@adventurerp",
        "youtube_enabled": true,
        "youtube_url": "https://youtube.com/@adventurerp",
        "show_in_footer": true,
        "show_in_hero": true,
        "animation_enabled": true
    }',
    updated_at = now();