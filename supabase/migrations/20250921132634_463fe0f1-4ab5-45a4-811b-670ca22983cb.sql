-- Create server_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.server_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on server_settings
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for server_settings - Allow staff to manage all settings
CREATE POLICY "Staff can manage server settings" 
ON public.server_settings 
FOR ALL 
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Create policy for reading settings (more permissive for reading)
CREATE POLICY "Anyone can read server settings" 
ON public.server_settings 
FOR SELECT 
USING (true);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_server_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_server_settings_updated_at
  BEFORE UPDATE ON public.server_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_server_settings_updated_at();