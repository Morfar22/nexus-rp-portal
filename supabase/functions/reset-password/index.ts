import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main edge function handler
const handler = async (req: Request): Promise<Response> => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Reset password function called");

    // Parse payload
    let body: { email?: string; newPassword?: string; token?: string };
    try {
      body = await req.json();
      console.log("Incoming request body:", { email: body.email, hasPassword: !!body.newPassword, hasToken: !!body.token });
    } catch {
      console.log("Failed to parse request body");
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, newPassword, token } = body;

    if (!email || !newPassword || !token) {
      return new Response(
        JSON.stringify({ error: "Email, token, and new password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user exists and validate reset token
    const { data: customUser, error: findUserError } = await supabaseAdmin
      .from('custom_users')
      .select('id, email, reset_token, reset_token_expires')
      .eq('email', email)
      .single();

    if (findUserError || !customUser) {
      console.log("User not found in custom_users table:", findUserError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate reset token
    if (!customUser.reset_token || customUser.reset_token !== token) {
      console.log("Invalid reset token for user:", customUser.email);
      return new Response(
        JSON.stringify({ error: "Invalid or missing reset token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token has expired
    if (!customUser.reset_token_expires || new Date() > new Date(customUser.reset_token_expires)) {
      console.log("Expired reset token for user:", customUser.email);
      return new Response(
        JSON.stringify({ error: "Reset token has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Valid reset token for user:", customUser.email);

    // Hash the new password using SHA-256 (to match custom-login function)
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Password hashed using SHA-256 successfully");

    // Update the user's password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('custom_users')
      .update({ 
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', customUser.id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    console.log("Password updated successfully for user:", customUser.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        }
      }
    );
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to reset password",
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);