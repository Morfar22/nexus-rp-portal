-- Create sample data with correct jsonb format

-- Insert sample community votes with jsonb options
INSERT INTO community_votes (title, description, options, vote_type, created_by, starts_at, ends_at, is_active, requires_staff_approval, min_participation) VALUES
('Server Event Type', 'What type of events would you like to see more of?', '["Racing Events", "Business Events", "Social Gatherings", "PvP Tournaments"]'::jsonb, 'simple', (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1), NOW(), NOW() + INTERVAL '7 days', true, false, 0),
('New Server Feature', 'Which feature should we prioritize next?', '["Housing System", "Casino Games", "Custom Vehicles", "Job Expansion"]'::jsonb, 'simple', (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1), NOW(), NOW() + INTERVAL '14 days', true, false, 0);

-- Insert sample RP events  
INSERT INTO rp_events (title, description, event_date, duration_minutes, max_participants, location, event_type, created_by, status, requirements, rewards, is_public) VALUES
('Street Racing Championship', 'Join the underground street racing scene and compete for the ultimate prize!', NOW() + INTERVAL '2 days', 120, 20, 'Los Santos Highway', 'racing', (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1), 'scheduled', 'Must have a racing license', '$50,000 cash prize', true),
('Business Summit', 'Network with other business owners and discuss new opportunities', NOW() + INTERVAL '5 days', 90, 15, 'Downtown Conference Center', 'business', (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1), 'scheduled', 'Must own a business', 'Exclusive business contracts', true),
('Police Academy Graduation', 'Ceremony for new police recruits joining the force', NOW() + INTERVAL '3 days', 60, 50, 'Police Station', 'police', (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1), 'scheduled', 'Open to public', 'Honor and recognition', true);

-- Add more sample achievements with better English names
INSERT INTO achievements (name, description, icon, category, points, rarity, requirements, is_active) VALUES
('First Steps', 'Complete your first action on the server', 'Trophy', 'general', 10, 'common', '{}', true),
('Social Butterfly', 'Make 5 friends on the server', 'Users', 'social', 25, 'uncommon', '{}', true),
('Dedicated Player', 'Play for 10 hours total', 'Clock', 'general', 50, 'rare', '{}', true),
('Master Trader', 'Complete 50 successful trades', 'DollarSign', 'economy', 100, 'epic', '{}', true),
('Legend', 'Reach maximum reputation level', 'Crown', 'special', 500, 'legendary', '{}', true);