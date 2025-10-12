-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT,
  connection_type TEXT,
  session_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance analysis table
CREATE TABLE IF NOT EXISTS public.performance_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_type TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for performance_metrics
CREATE POLICY "Anyone can insert performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Create policies for performance_analysis
CREATE POLICY "Staff can manage performance analysis" 
ON public.performance_analysis 
FOR ALL
USING (is_staff(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_time 
ON public.performance_metrics (metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_url 
ON public.performance_metrics (url);

CREATE INDEX IF NOT EXISTS idx_performance_analysis_type_time 
ON public.performance_analysis (analysis_type, created_at DESC);