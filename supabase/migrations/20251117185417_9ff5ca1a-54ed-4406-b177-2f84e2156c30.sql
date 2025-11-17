-- Add unique constraint to template_type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_templates_template_type_key'
  ) THEN
    ALTER TABLE email_templates 
    ADD CONSTRAINT email_templates_template_type_key UNIQUE (template_type);
  END IF;
END $$;