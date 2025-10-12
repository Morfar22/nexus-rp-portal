-- Add required_permissions field to application_types table
ALTER TABLE application_types 
ADD COLUMN required_permissions text[] DEFAULT '{}';

-- Add required_permissions field to applications table  
ALTER TABLE applications 
ADD COLUMN required_permissions text[] DEFAULT '{}';

-- Add comments to explain the fields
COMMENT ON COLUMN application_types.required_permissions IS 'Array of permission names required to view/manage applications of this type';
COMMENT ON COLUMN applications.required_permissions IS 'Array of permission names required to view/manage this specific application';