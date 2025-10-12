-- Create system_health_checks table for monitoring system components
CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component VARCHAR NOT NULL, -- 'database', 'api', 'backup', 'security'
  status VARCHAR NOT NULL DEFAULT 'healthy', -- 'healthy', 'warning', 'error'
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_metrics table for tracking revenue and financial data
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR NOT NULL, -- 'revenue', 'transaction', 'chargeback', 'refund'
  amount INTEGER, -- amount in smallest currency unit (cents)
  currency VARCHAR NOT NULL DEFAULT 'DKK',
  stripe_payment_id TEXT,
  package_id UUID REFERENCES public.packages(id),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create website_analytics table for tracking visitor and page data
CREATE TABLE IF NOT EXISTS public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  page_path VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL, -- 'page_view', 'application_start', 'application_submit'
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  device_type VARCHAR, -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR,
  country VARCHAR,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_activity_logs table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS public.audit_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type VARCHAR NOT NULL, -- 'application', 'staff_action', 'security', 'system', 'user'
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high'
  actor_id UUID, -- who performed the action
  actor_name VARCHAR,
  target_id UUID, -- what was affected
  target_type VARCHAR, -- 'user', 'application', 'server', etc.
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create server_performance_metrics table for detailed server monitoring
CREATE TABLE IF NOT EXISTS public.server_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_name VARCHAR NOT NULL DEFAULT 'main',
  players_online INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 64,
  cpu_usage INTEGER, -- percentage
  ram_usage INTEGER, -- percentage  
  disk_usage INTEGER, -- percentage
  network_latency_ms INTEGER,
  uptime_seconds BIGINT,
  status VARCHAR NOT NULL DEFAULT 'online', -- 'online', 'offline', 'maintenance'
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff access
CREATE POLICY "Staff can view system health checks" ON public.system_health_checks
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can create health checks" ON public.system_health_checks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view financial metrics" ON public.financial_metrics
  FOR SELECT USING (check_user_is_admin(auth.uid()));

CREATE POLICY "System can create financial metrics" ON public.financial_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view website analytics" ON public.website_analytics
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can create analytics events" ON public.website_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view audit logs" ON public.audit_activity_logs
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can create audit logs" ON public.audit_activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view server performance" ON public.server_performance_metrics
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can create performance metrics" ON public.server_performance_metrics
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_health_checks_component ON public.system_health_checks(component);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON public.system_health_checks(checked_at);

CREATE INDEX IF NOT EXISTS idx_financial_metrics_type ON public.financial_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_recorded_at ON public.financial_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_website_analytics_page_path ON public.website_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_website_analytics_recorded_at ON public.website_analytics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_audit_activity_logs_type ON public.audit_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_audit_activity_logs_created_at ON public.audit_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_server_performance_server_name ON public.server_performance_metrics(server_name);
CREATE INDEX IF NOT EXISTS idx_server_performance_recorded_at ON public.server_performance_metrics(recorded_at);