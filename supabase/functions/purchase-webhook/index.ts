import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    
    // Parse the data
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      throw new Error('Invalid JSON in request body');
    }
    
    const { customerEmail, customerName, packageName, price, currency } = parsedData;

    // Validate the data looks legitimate
    if (!customerEmail || !price || price <= 0) {
      return new Response(JSON.stringify({ 
        error: "Invalid webhook data" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false }
      }
    );

    // Get user profile for more info
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("username, email")
        .eq("email", customerEmail)
        .maybeSingle();
      
      if (profileError) {
        // Silent error handling
      } else {
        userProfile = profile;
      }
    } catch (error) {
      // Silent error handling
    }

    // Send purchase notification to Discord via direct HTTP call
    try {
      const discordResponse = await fetch(`https://vqvluqwadoaerghwyohk.supabase.co/functions/v1/discord-logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        },
        body: JSON.stringify({
          type: 'purchase_completed',
          data: {
            customerEmail,
            customerName: customerName || userProfile?.username,
            username: userProfile?.username || customerName,
            packageName,
            price,
            currency: currency?.toUpperCase() || 'USD'
          }
        })
      });

      const discordResult = await discordResponse.text();
      
      if (!discordResponse.ok) {
        // Silent error handling
      }
    } catch (error) {
      // Silent error handling
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});