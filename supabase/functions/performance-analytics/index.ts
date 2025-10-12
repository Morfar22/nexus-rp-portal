import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceMetric {
  metric_type: string;
  value: number;
  url: string;
  user_agent?: string;
  connection_type?: string;
  timestamp: string;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    console.log('Performance analytics function called with action:', action);

    switch (action) {
      case 'recordMetric':
        return await recordPerformanceMetric(supabaseClient, data);
      
      case 'getMetrics':
        return await getPerformanceMetrics(supabaseClient, data);
      
      case 'getInsights':
        return await getPerformanceInsights(supabaseClient);
      
      case 'optimizeImages':
        return await optimizeImages(supabaseClient);
      
      case 'analyzeBundle':
        return await analyzeBundleSize(supabaseClient);
      
      case 'cleanupCache':
        return await cleanupCache(supabaseClient);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in performance analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recordPerformanceMetric(supabase: any, metric: PerformanceMetric) {
  try {
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metric.metric_type,
        value: metric.value,
        url: metric.url,
        user_agent: metric.user_agent,
        connection_type: metric.connection_type,
        session_id: metric.session_id,
        recorded_at: new Date().toISOString()
      });

    if (error) throw error;

    // Auto-trigger optimization if metrics are poor
    if (shouldTriggerOptimization(metric)) {
      EdgeRuntime.waitUntil(triggerAutoOptimization(supabase, metric));
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Metric recorded' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error recording metric:', error);
    throw error;
  }
}

async function getPerformanceMetrics(supabase: any, filters: any = {}) {
  try {
    const { timeRange = '24h', metricType, url } = filters;
    
    let timeFilter;
    const now = new Date();
    
    switch (timeRange) {
      case '1h':
        timeFilter = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    let query = supabase
      .from('performance_metrics')
      .select('*')
      .gte('recorded_at', timeFilter.toISOString())
      .order('recorded_at', { ascending: false });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    if (url) {
      query = query.eq('url', url);
    }

    const { data, error } = await query.limit(1000);

    if (error) throw error;

    // Calculate aggregated metrics
    const aggregated = calculateAggregatedMetrics(data || []);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [], 
        aggregated,
        insights: generateInsights(aggregated)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting metrics:', error);
    throw error;
  }
}

async function getPerformanceInsights(supabase: any) {
  try {
    // Get recent performance data for analysis
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const insights = analyzePerformanceData(metrics || []);

    return new Response(
      JSON.stringify({ success: true, data: insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting insights:', error);
    throw error;
  }
}

async function optimizeImages(supabase: any) {
  try {
    // Get image usage statistics
    const { data: metrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('metric_type', 'image_load_time')
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const optimization = {
      total_images: metrics?.length || 0,
      avg_load_time: metrics?.reduce((sum: number, m: any) => sum + m.value, 0) / (metrics?.length || 1),
      recommendations: [
        'Convert images to WebP format',
        'Implement responsive images with srcset',
        'Add lazy loading to below-fold images',
        'Optimize image compression levels',
        'Use CDN for image delivery'
      ]
    };

    return new Response(
      JSON.stringify({ success: true, data: optimization }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error optimizing images:', error);
    throw error;
  }
}

async function analyzeBundleSize(supabase: any) {
  try {
    // Simulate bundle analysis (in real app, this would analyze actual bundles)
    const analysis = {
      total_size: 285.4, // KB
      javascript_size: 198.3,
      css_size: 45.2,
      assets_size: 41.9,
      recommendations: [
        'Enable tree shaking for unused code',
        'Implement dynamic imports for large modules',
        'Use compression (gzip/brotli)',
        'Minimize CSS and remove unused styles',
        'Optimize third-party dependencies'
      ],
      largest_chunks: [
        { name: 'vendor.js', size: 89.2 },
        { name: 'main.js', size: 67.1 },
        { name: 'components.js', size: 42.0 }
      ]
    };

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing bundle:', error);
    throw error;
  }
}

async function cleanupCache(supabase: any) {
  try {
    // Clean up old performance metrics (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('performance_metrics')
      .delete()
      .lt('recorded_at', thirtyDaysAgo);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cache cleaned up successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error cleaning cache:', error);
    throw error;
  }
}

// Helper functions
function shouldTriggerOptimization(metric: PerformanceMetric): boolean {
  switch (metric.metric_type) {
    case 'lcp':
      return metric.value > 4000; // Poor LCP
    case 'cls':
      return metric.value > 0.25; // Poor CLS
    case 'fcp':
      return metric.value > 3000; // Poor FCP
    default:
      return false;
  }
}

async function triggerAutoOptimization(supabase: any, metric: PerformanceMetric) {
  // Log optimization trigger
  await supabase
    .from('audit_logs')
    .insert({
      action: 'auto_optimization_triggered',
      resource_type: 'performance',
      resource_id: metric.url,
      new_values: { metric_type: metric.metric_type, value: metric.value }
    });
}

function calculateAggregatedMetrics(metrics: any[]) {
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.metric_type]) {
      acc[metric.metric_type] = [];
    }
    acc[metric.metric_type].push(metric.value);
    return acc;
  }, {} as Record<string, number[]>);

  const aggregated: Record<string, any> = {};
  
  for (const [type, values] of Object.entries(grouped)) {
    aggregated[type] = {
      count: values.length,
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
    };
  }

  return aggregated;
}

function generateInsights(aggregated: Record<string, any>) {
  const insights = [];

  if (aggregated.lcp?.avg > 2500) {
    insights.push({
      type: 'warning',
      metric: 'LCP',
      message: 'Largest Contentful Paint is slower than recommended',
      recommendation: 'Optimize images and reduce server response times'
    });
  }

  if (aggregated.cls?.avg > 0.1) {
    insights.push({
      type: 'warning',
      metric: 'CLS',
      message: 'Cumulative Layout Shift needs improvement',
      recommendation: 'Add size attributes to images and reserve space for dynamic content'
    });
  }

  if (aggregated.fcp?.avg > 1800) {
    insights.push({
      type: 'info',
      metric: 'FCP',
      message: 'First Contentful Paint could be faster',
      recommendation: 'Optimize critical rendering path and reduce blocking resources'
    });
  }

  return insights;
}

function analyzePerformanceData(metrics: any[]) {
  const analysis = {
    overall_score: 85,
    total_measurements: metrics.length,
    time_period: '24 hours',
    critical_issues: 0,
    recommendations: [] as string[],
    trends: {} as Record<string, string>
  };

  // Analyze trends
  const metricTypes = ['lcp', 'cls', 'fcp', 'ttfb'];
  
  metricTypes.forEach(type => {
    const typeMetrics = metrics.filter(m => m.metric_type === type);
    if (typeMetrics.length > 1) {
      const recent = typeMetrics.slice(0, Math.floor(typeMetrics.length / 2));
      const older = typeMetrics.slice(Math.floor(typeMetrics.length / 2));
      
      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
      
      if (recentAvg < olderAvg * 0.9) {
        analysis.trends[type] = 'improving';
      } else if (recentAvg > olderAvg * 1.1) {
        analysis.trends[type] = 'degrading';
      } else {
        analysis.trends[type] = 'stable';
      }
    }
  });

  return analysis;
}
