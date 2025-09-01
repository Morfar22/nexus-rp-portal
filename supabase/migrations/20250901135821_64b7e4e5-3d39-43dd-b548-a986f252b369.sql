-- Add your admin user to custom_users if not exists
INSERT INTO custom_users (id, email, username, role, banned, email_verified) 
VALUES (
  '5027696b-aa78-4d31-84c6-a94ee5940f5f'::uuid,
  'emilfrobergww@gmail.com',
  'Mmorfar',
  'admin',
  false,
  true
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  banned = false,
  email_verified = true;