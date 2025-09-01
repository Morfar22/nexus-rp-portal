import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response("Invalid verification link", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find verification token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*, custom_users(*)')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response("Invalid or expired verification link", { status: 400 });
    }

    // Mark token as used
    await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    // Mark user as verified
    await supabase
      .from('custom_users')
      .update({ email_verified: true })
      .eq('id', tokenData.user_id);

    // Redirect to login page with success message
    const redirectUrl = `${req.headers.get('referer') || 'https://adventurerp.dk'}/auth?verified=true`;
    
    return new Response(null, {
      status: 302,
      headers: { 
        'Location': redirectUrl,
        ...corsHeaders 
      }
    });

  } catch (error: any) {
    console.error('Error in verify-email:', error);
    return new Response("An error occurred during verification", { status: 500 });
  }
});