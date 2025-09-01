-- Add some test user achievements for debugging
INSERT INTO user_achievements (user_id, achievement_id, earned_at, progress)
VALUES 
  ('a479d074-615a-4640-845e-8446ae84097a', 'f6485d8e-9d02-4d6f-a0e5-03c24087064b', NOW(), 100),
  ('a479d074-615a-4640-845e-8446ae84097a', '75786dc1-16d1-47dd-8ee6-a4de933c71a7', NOW(), 100)
ON CONFLICT (user_id, achievement_id) DO NOTHING;