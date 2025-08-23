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

    let data = [];
    
    switch (logType) {
      case 'auth':
        try {
          // Query auth logs using analytics query
          const authQuery = `
            select id, timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error 
            from auth_logs
            cross join unnest(metadata) as metadata
            order by timestamp desc
            limit ${limit}
          `;
          
          const { data: authData, error: authError } = await supabase.rpc('analytics_query', {
            query: authQuery
          });
            
          if (authError) {
            console.error('Auth logs query error:', authError);
            data = [];
          } else {
            data = authData?.map(log => ({
              id: log.id,
              timestamp: new Date(log.timestamp).toISOString(),
              message: log.event_message || log.msg || 'No message',
              level: log.level || 'info',
              status: log.status,
              path: log.path,
              error: log.error
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching auth logs:', error);
          data = [];
        }
        break;
        
      case 'database':
        try {
          // Query database logs using analytics query
          const dbQuery = `
            select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity 
            from postgres_logs
            cross join unnest(metadata) as m
            cross join unnest(m.parsed) as parsed
            order by timestamp desc
            limit ${limit}
          `;
          
          const { data: dbData, error: dbError } = await supabase.rpc('analytics_query', {
            query: dbQuery
          });
            
          if (dbError) {
            console.error('Database logs query error:', dbError);
            data = [];
          } else {
            data = dbData?.map(log => ({
              id: log.id,
              timestamp: new Date(log.timestamp).toISOString(),
              message: log.event_message,
              level: (log.error_severity || 'LOG').toLowerCase(),
              identifier: log.identifier
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching database logs:', error);
          data = [];
        }
        break;
        
      case 'functions':
        try {
          // Query edge function logs using analytics query
          const funcQuery = `
            select id, function_edge_logs.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version 
            from function_edge_logs
            cross join unnest(metadata) as m
            cross join unnest(m.response) as response
            cross join unnest(m.request) as request
            order by timestamp desc
            limit ${limit}
          `;
          
          const { data: funcData, error: funcError } = await supabase.rpc('analytics_query', {
            query: funcQuery
          });
            
          if (funcError) {
            console.error('Function logs query error:', funcError);
            data = [];
          } else {
            data = funcData?.map(log => ({
              id: log.id,
              timestamp: new Date(log.timestamp).toISOString(),
              message: log.event_message,
              level: 'log',
              functionId: log.function_id,
              statusCode: log.status_code,
              method: log.method,
              executionTime: log.execution_time_ms
            })) || [];
          }
        } catch (error) {
          console.error('Error fetching function logs:', error);
          data = [];
        }
        break;
        
      default:
        throw new Error('Invalid log type. Must be auth, database, or functions');
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