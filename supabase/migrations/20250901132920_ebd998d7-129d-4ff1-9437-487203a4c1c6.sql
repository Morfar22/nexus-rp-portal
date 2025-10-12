-- Give admin permissions to emilfrobergww@gmail.com
-- Update their role in custom_users table to 'admin'

UPDATE custom_users 
SET role = 'admin', updated_at = now()
WHERE email = 'emilfrobergww@gmail.com';

-- Verify the update
DO $$
DECLARE
  user_record record;
BEGIN
  SELECT id, email, username, role INTO user_record
  FROM custom_users 
  WHERE email = 'emilfrobergww@gmail.com';
  
  IF user_record.role = 'admin' THEN
    RAISE NOTICE 'Successfully granted admin permissions to user % (%) with username %', 
      user_record.email, user_record.id, user_record.username;
  ELSE
    RAISE EXCEPTION 'Failed to update user role';
  END IF;
END $$;