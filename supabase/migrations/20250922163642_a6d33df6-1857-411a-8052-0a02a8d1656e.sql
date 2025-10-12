-- Update the first admin user to have admin role
UPDATE custom_users SET role = 'admin' WHERE email = 'christofferkongen@gmail.com';