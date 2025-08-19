import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Set up CORS headers so it works cross-origin (browser safe)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  userEmail: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// The edge function handler
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    console.log("Password reset function called");

    // Validate and parse POST body
    let body: ResetPasswordRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({
        error: "Invalid request body",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { userEmail } = body || {};
    if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
      return new Response(JSON.stringify({
        error: "A valid email address is required",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Build the redirect domain (default if missing)
    const originHeader = req.headers.get("origin") || req.headers.get("referer");
    const redirectDomain = originHeader || "https://c2b9c9da-596f-4acf-999d-5d33f978ad1b.lovableproject.com";
    console.log("Using redirect domain:", redirectDomain);

    // Generate the password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userEmail,
      options: {
        redirectTo: `${redirectDomain}/auth`,
      },
    });

    if (error) {
      // Forward Supabase errors to client
      throw error;
    }
    console.log("Password reset link generated for:", userEmail);

    // Send the password reset email via Resend
    const emailResponse = await resend.emails.send({
      from: "Gaming Community <noreply@mmorfar.dk>",
      to: [userEmail],
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff6b6b; text-align: center;">Password Reset Request</h1>
          <p>You have requested to reset your password for your Gaming Community account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.properties.action_link}" 
               style="background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
            ${data.properties.action_link}
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request this password reset, you can safely ignore this email.
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
        emailResponse,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
