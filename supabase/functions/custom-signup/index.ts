import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, username } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('custom_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists with this email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Hash password
    const passwordHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password + email.toLowerCase())
    );
    const hashArray = Array.from(new Uint8Array(passwordHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create user
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashHex,
        username: username || null,
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Generate email verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create verification token:', tokenError);
    } else {
      // Send verification email
      const verificationUrl = `${supabaseUrl}/functions/v1/verify-email?token=${verificationToken}`;
      
      try {
        await resend.emails.send({
          from: "Adventurer RP <noreply@adventurerp.dk>",
          to: [email],
          subject: "Verify your email address",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px;">
              <h1>Welcome to Adventurer RP!</h1>
              <p>Please click the button below to verify your email address:</p>
              <a href="${verificationUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Verify Email
              </a>
              <p>Or copy and paste this link: ${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created successfully. Please check your email to verify your account.",
        userId: user.id 
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in custom-signup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});