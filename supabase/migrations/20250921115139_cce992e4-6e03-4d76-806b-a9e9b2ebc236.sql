-- Enable RLS on critical tables that are missing it
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for server_settings table
CREATE POLICY "Staff can manage server settings" ON public.server_settings
FOR ALL USING (is_staff(auth.uid()));

-- Add RLS policies for servers table  
CREATE POLICY "Staff can manage servers" ON public.servers
FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Public can view active servers" ON public.servers
FOR SELECT USING (is_active = true);