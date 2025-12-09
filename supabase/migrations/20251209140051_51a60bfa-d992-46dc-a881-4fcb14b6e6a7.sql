-- Add AI detection columns to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS ai_detected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_detection_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_checked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ai_checked_by uuid REFERENCES public.custom_users(id);

-- Add comment for documentation
COMMENT ON COLUMN public.applications.ai_detected IS 'Whether AI-generated content was detected in this application';
COMMENT ON COLUMN public.applications.ai_detection_score IS 'AI detection confidence score (0-100)';
COMMENT ON COLUMN public.applications.ai_checked_at IS 'Timestamp when AI check was performed';
COMMENT ON COLUMN public.applications.ai_checked_by IS 'Staff member who initiated the AI check';