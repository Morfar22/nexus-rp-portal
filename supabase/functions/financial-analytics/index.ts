import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FINANCIAL-ANALYTICS] ${step}${detailsStr}`);
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
      throw new Error('Insufficient permissions');
    }

    const { action, period = 'month' } = await req.json();
    logStep("Request parsed", { action, period });

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    switch (action) {
      case 'getFinancialOverview': {
        // Get financial metrics from database
        const { data: metrics } = await supabaseClient
          .from('financial_metrics')
          .select('*')
          .gte('recorded_at', startDate.toISOString());

        const revenue = metrics?.filter(m => m.metric_type === 'revenue')
          .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
        
        const transactions = metrics?.filter(m => m.metric_type === 'transaction').length || 0;
        const chargebacks = metrics?.filter(m => m.metric_type === 'chargeback').length || 0;
        const refunds = metrics?.filter(m => m.metric_type === 'refund')
          .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;

        // Get package popularity
        const packageMetrics = metrics?.filter(m => m.package_id) || [];
        const packageCounts = packageMetrics.reduce((acc, m) => {
          if (m.package_id) {
            acc[m.package_id] = (acc[m.package_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topPackageId = Object.entries(packageCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        let topPackageName = "No sales yet";
        if (topPackageId) {
          const { data: pkg } = await supabaseClient
            .from('packages')
            .select('name')
            .eq('id', topPackageId)
            .single();
          topPackageName = pkg?.name || "Unknown Package";
        }

        // Calculate growth (compare with previous period)
        const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const { data: previousMetrics } = await supabaseClient
          .from('financial_metrics')
          .select('*')
          .gte('recorded_at', previousPeriodStart.toISOString())
          .lt('recorded_at', startDate.toISOString());

        const previousRevenue = previousMetrics?.filter(m => m.metric_type === 'revenue')
          .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
        
        const growthRate = previousRevenue > 0 ? 
          ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

        return new Response(JSON.stringify({
          success: true,
          data: {
            revenue: revenue / 100, // Convert from øre to DKK
            transactions,
            chargebacks,
            refunds: refunds / 100,
            topPackage: topPackageName,
            avgOrderValue: transactions > 0 ? revenue / transactions / 100 : 0,
            growthRate: Math.round(growthRate * 10) / 10,
            period
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'syncStripeData': {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
          throw new Error("Stripe not configured");
        }

        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        
        // Fetch recent Stripe charges
        const charges = await stripe.charges.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 100
        });

        logStep("Fetched Stripe charges", { count: charges.data.length });

        // Process and store financial metrics
        for (const charge of charges.data) {
          // Check if we already have this charge
          const { data: existing } = await supabaseClient
            .from('financial_metrics')
            .select('id')
            .eq('stripe_payment_id', charge.id)
            .maybeSingle();

          if (!existing) {
            await supabaseClient.from('financial_metrics').insert({
              metric_type: charge.status === 'succeeded' ? 'revenue' : 'transaction',
              amount: charge.amount,
              currency: charge.currency.toUpperCase(),
              stripe_payment_id: charge.id,
              user_id: charge.metadata?.user_id || null,
              package_id: charge.metadata?.package_id || null,
              metadata: {
                stripe_customer_id: charge.customer,
                payment_method: charge.payment_method_details?.type,
                description: charge.description
              }
            });
          }
        }

        // Fetch disputes (chargebacks)
        const disputes = await stripe.disputes.list({
          created: { gte: Math.floor(startDate.getTime() / 1000) },
          limit: 50
        });

        for (const dispute of disputes.data) {
          const { data: existing } = await supabaseClient
            .from('financial_metrics')
            .select('id')
            .eq('stripe_payment_id', dispute.charge)
            .eq('metric_type', 'chargeback')
            .maybeSingle();

          if (!existing) {
            await supabaseClient.from('financial_metrics').insert({
              metric_type: 'chargeback',
              amount: dispute.amount,
              currency: dispute.currency.toUpperCase(),
              stripe_payment_id: dispute.charge,
              metadata: {
                dispute_reason: dispute.reason,
                status: dispute.status
              }
            });
          }
        }

        logStep("Stripe data synced", { charges: charges.data.length, disputes: disputes.data.length });

        return new Response(JSON.stringify({
          success: true,
          message: `Synced ${charges.data.length} charges and ${disputes.data.length} disputes`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'getRevenueChart': {
        // Get daily revenue for chart
        const { data: dailyMetrics } = await supabaseClient
          .from('financial_metrics')
          .select('amount, recorded_at')
          .eq('metric_type', 'revenue')
          .gte('recorded_at', startDate.toISOString())
          .order('recorded_at');

        // Group by day
        const dailyRevenue = dailyMetrics?.reduce((acc, m) => {
          const day = new Date(m.recorded_at).toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + (m.amount || 0);
          return acc;
        }, {} as Record<string, number>) || {};

        const chartData = Object.entries(dailyRevenue)
          .map(([date, amount]) => ({
            date,
            revenue: amount / 100 // Convert to DKK
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(JSON.stringify({
          success: true,
          data: chartData
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