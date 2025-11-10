-- Create translation_overrides table for managing custom translations
CREATE TABLE IF NOT EXISTS public.translation_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  translation_key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.custom_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(translation_key, locale)
);

-- Enable RLS
ALTER TABLE public.translation_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active translations
CREATE POLICY "Anyone can view active translations"
ON public.translation_overrides
FOR SELECT
USING (is_active = true);

-- Policy: Staff can manage translations
CREATE POLICY "Staff can manage translations"
ON public.translation_overrides
FOR ALL
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_translation_overrides_locale ON public.translation_overrides(locale);
CREATE INDEX IF NOT EXISTS idx_translation_overrides_category ON public.translation_overrides(category);
CREATE INDEX IF NOT EXISTS idx_translation_overrides_key ON public.translation_overrides(translation_key);

-- Create trigger to update updated_at
CREATE TRIGGER update_translation_overrides_updated_at
BEFORE UPDATE ON public.translation_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.translation_overrides;