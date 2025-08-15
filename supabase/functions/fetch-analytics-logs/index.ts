import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogRequest {
  logType: 'auth' | 'database' | 'functions';
  limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { logType, limit = 100 }: LogRequest = await req.json();

    console.log(`Fetching ${logType} logs with limit ${limit}`);

    let query = '';
    
    switch (logType) {
      case 'auth':
        query = `
          select id, auth_logs.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error 
          from auth_logs
          cross join unnest(metadata) as metadata
          order by timestamp desc
          limit ${limit}
        `;
        break;
        
      case 'database':
        query = `
          select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity 
          from postgres_logs
          cross join unnest(metadata) as m
          cross join unnest(m.parsed) as parsed
          order by timestamp desc
          limit ${limit}
        `;
        break;
        
      case 'functions':
        query = `
          select id, function_edge_logs.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version 
          from function_edge_logs
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          order by timestamp desc
          limit ${limit}
        `;
        break;
        
      default:
        throw new Error('Invalid log type. Must be auth, database, or functions');
    }

    // Execute the analytics query
    const { data, error } = await supabase.rpc('analytics_query', { query });

    if (error) {
      console.error('Analytics query error:', error);
      throw error;
    }

    console.log(`Successfully fetched ${data?.length || 0} ${logType} logs`);

    return new Response(
      JSON.stringify({ 
        data: data || [],
        success: true,
        logType,
        count: data?.length || 0
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error in fetch-analytics-logs:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});