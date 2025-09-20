-- Update the first user to be an admin for testing
UPDATE custom_users 
SET role = 'admin' 
WHERE email = 'cs.bennetzen@gmail.com';

-- Let's also add some default permissions data if they don't exist
INSERT INTO permissions (name, display_name, description, category) VALUES
('packages.manage', 'Manage Packages', 'Can create, edit and delete subscription packages', 'packages')
ON CONFLICT (name) DO NOTHING;