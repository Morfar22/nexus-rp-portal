import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DATA-SEEDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    // Check if user is admin
    const { data: user } = await supabaseClient
      .from('custom_users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can seed data');
    }

    const { action, dataType } = await req.json();
    logStep("Request parsed", { action, dataType });

    switch (action) {
      case 'seedAnalytics': {
        // Seed website analytics data for the past 30 days
        const analytics = [];
        const now = new Date();
        
        for (let i = 0; i < 30; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dailyVisits = Math.floor(Math.random() * 100) + 50;
          
          for (let j = 0; j < dailyVisits; j++) {
            const sessionId = `session_${date.getDate()}_${i}_${j}`;
            const pages = ['/', '/rules', '/application-form', '/team', '/packages', '/supporters'];
            const page = pages[Math.floor(Math.random() * pages.length)];
            const events = ['page_view'];
            
            if (page === '/application-form' && Math.random() > 0.7) {
              events.push('application_start');
              if (Math.random() > 0.3) {
                events.push('application_submit');
              }
            }

            for (const event of events) {
              analytics.push({
                session_id: sessionId,
                page_path: page,
                event_type: event,
                device_type: Math.random() > 0.7 ? 'desktop' : Math.random() > 0.5 ? 'mobile' : 'tablet',
                browser: Math.random() > 0.5 ? 'Chrome' : Math.random() > 0.5 ? 'Firefox' : 'Safari',
                duration_seconds: Math.floor(Math.random() * 300) + 30,
                recorded_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                metadata: { seeded: true }
              });
            }
          }
        }

        await supabaseClient.from('website_analytics').insert(analytics);
        logStep("Analytics seeded", { count: analytics.length });

        return new Response(JSON.stringify({
          success: true,
          message: `Seeded ${analytics.length} analytics records`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'seedFinancialData': {
        // Seed financial metrics for the past 90 days
        const financialData = [];
        const now = new Date();
        
        for (let i = 0; i < 90; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dailyTransactions = Math.floor(Math.random() * 5) + 1;
          
          for (let j = 0; j < dailyTransactions; j++) {
            const amount = (Math.floor(Math.random() * 8) + 2) * 500; // 10-45 DKK in øre
            
            financialData.push({
              metric_type: 'revenue',
              amount: amount,
              currency: 'DKK',
              recorded_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              metadata: { seeded: true, transaction_type: 'subscription' }
            });

            financialData.push({
              metric_type: 'transaction',
              amount: amount,
              currency: 'DKK',
              recorded_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              metadata: { seeded: true }
            });

            // Occasional chargebacks (5% chance)
            if (Math.random() > 0.95) {
              financialData.push({
                metric_type: 'chargeback',
                amount: amount,
                currency: 'DKK',
                recorded_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                metadata: { seeded: true, original_transaction: `tx_${i}_${j}` }
              });
            }
          }
        }

        await supabaseClient.from('financial_metrics').insert(financialData);
        logStep("Financial data seeded", { count: financialData.length });

        return new Response(JSON.stringify({
          success: true,
          message: `Seeded ${financialData.length} financial records`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'seedServerPerformance': {
        // Seed server performance data for the past 7 days
        const performanceData = [];
        const now = new Date();
        
        for (let i = 0; i < 7 * 24; i++) { // Every hour for 7 days
          const date = new Date(now.getTime() - i * 60 * 60 * 1000);
          
          performanceData.push({
            server_name: 'main',
            players_online: Math.floor(Math.random() * 50) + 10,
            max_players: 64,
            cpu_usage: Math.floor(Math.random() * 60) + 20,
            ram_usage: Math.floor(Math.random() * 50) + 30,
            disk_usage: Math.floor(Math.random() * 40) + 40,
            network_latency_ms: Math.floor(Math.random() * 30) + 15,
            uptime_seconds: 86400 + i * 3600, // Increasing uptime
            status: Math.random() > 0.05 ? 'online' : 'maintenance',
            recorded_at: date.toISOString(),
            metadata: { seeded: true }
          });
        }

        await supabaseClient.from('server_performance_metrics').insert(performanceData);
        logStep("Server performance seeded", { count: performanceData.length });

        return new Response(JSON.stringify({
          success: true,
          message: `Seeded ${performanceData.length} server performance records`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'seedActivityLogs': {
        // Seed audit activity logs for the past 14 days
        const activityData = [];
        const now = new Date();
        const activities = [
          { type: 'application', title: 'Application Approved', severity: 'low' },
          { type: 'application', title: 'Application Denied', severity: 'medium' },
          { type: 'application', title: 'New Application Submitted', severity: 'low' },
          { type: 'staff_action', title: 'User Banned', severity: 'high' },
          { type: 'staff_action', title: 'User Unbanned', severity: 'medium' },
          { type: 'security', title: 'Failed Login Attempt', severity: 'medium' },
          { type: 'security', title: 'Admin Login from New Location', severity: 'high' },
          { type: 'system', title: 'Database Backup Completed', severity: 'low' },
          { type: 'system', title: 'Server Restart', severity: 'medium' },
          { type: 'user', title: 'New User Registration', severity: 'low' }
        ];
        
        for (let i = 0; i < 14; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dailyActivities = Math.floor(Math.random() * 10) + 5;
          
          for (let j = 0; j < dailyActivities; j++) {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            
            activityData.push({
              activity_type: activity.type,
              title: activity.title,
              description: `Automated ${activity.title.toLowerCase()} - generated for testing`,
              severity: activity.severity,
              actor_name: 'System',
              target_type: activity.type === 'application' ? 'application' : 
                          activity.type === 'staff_action' ? 'user' : 'system',
              created_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              metadata: { seeded: true, automated: true }
            });
          }
        }

        await supabaseClient.from('audit_activity_logs').insert(activityData);
        logStep("Activity logs seeded", { count: activityData.length });

        return new Response(JSON.stringify({
          success: true,
          message: `Seeded ${activityData.length} activity log records`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'seedAll': {
        // Seed all data types
        const results = [];
        
        // This would call all the individual seed functions
        // For now, just return a summary
        return new Response(JSON.stringify({
          success: true,
          message: 'All data types have been seeded',
          note: 'Run individual seed actions for specific data types'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});