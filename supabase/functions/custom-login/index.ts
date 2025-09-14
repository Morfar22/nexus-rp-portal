import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compare, hash } from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is banned
    if (user.banned) {
      return new Response(
        JSON.stringify({ error: "Account suspended", banned: true, userInfo: { username: user.username, email: user.email } }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return new Response(
        JSON.stringify({ error: "Please verify your email address before signing in", emailNotVerified: true }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify password using bcrypt
    const isValidPassword = await compare(password, user.password_hash);

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Extract and validate IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    let ipAddress = null; // Use null instead of 'unknown' for inet type
    
    if (forwardedFor) {
      // Get first IP and clean it
      const firstIp = forwardedFor.split(',')[0].trim();
      
      // Validate IP format more strictly
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipRegex.test(firstIp)) {
        // Additional validation - check if octets are valid (0-255)
        const octets = firstIp.split('.');
        const validOctets = octets.every(octet => {
          const num = parseInt(octet, 10);
          return num >= 0 && num <= 255;
        });
        
        if (validOctets) {
          ipAddress = firstIp;
        }
      }
    }
    
    // If we couldn't get a valid IP, use null (which is acceptable for nullable inet column)
    console.log('Final IP address for database:', ipAddress);

    const { error: sessionError } = await supabase
      .from('custom_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      console.error('IP address being inserted:', ipAddress);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Update last login
    await supabase
      .from('custom_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Return user data and session token
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      email_verified: user.email_verified,
      role: user.role,
      avatar_url: user.avatar_url,
      full_name: user.full_name,
      created_at: user.created_at,
    };

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in custom-login:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});