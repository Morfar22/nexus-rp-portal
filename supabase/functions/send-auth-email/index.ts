import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-AUTH-EMAIL] ${step}${detailsStr}`);
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

logStep("Environment check", {
  hasResendKey: !!resendApiKey,
  hasHookSecret: !!hookSecret,
  resendKeyLength: resendApiKey ? resendApiKey.length : 0
});

if (!resendApiKey) {
  logStep("ERROR: RESEND_API_KEY missing - email sending will fail");
}
if (!hookSecret) {
  logStep("ERROR: SEND_EMAIL_HOOK_SECRET missing - webhook verification will fail");
}

serve(async (req) => {
  logStep("Function started", { method: req.method, url: req.url });
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    logStep("CORS preflight handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!resendApiKey) {
      logStep("ERROR: RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    if (!hookSecret) {
      logStep("ERROR: SEND_EMAIL_HOOK_SECRET not configured");
      throw new Error("SEND_EMAIL_HOOK_SECRET not configured");
    }

    logStep("Initializing Resend client");
    // Initialize Resend with the API key inside the handler
    const resend = new Resend(resendApiKey);

    logStep("Reading request payload");
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    logStep("Request data received", { payloadLength: payload.length, headerCount: Object.keys(headers).length });

    logStep("Verifying webhook signature");
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const evt = wh.verify(payload, headers) as unknown as {
      user: { email: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string; // signup | magiclink | recovery | email_change
        site_url?: string;
      };
    };
    logStep("Webhook verification successful");

    const userEmail = evt.user.email;
    const { token_hash, redirect_to, email_action_type } = evt.email_data;
    logStep("Event data extracted", { userEmail, email_action_type, hasRedirectTo: !!redirect_to });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://vqvluqwadoaerghwyohk.supabase.co";

    // Check if email exists in database for signup attempts
    if (email_action_type === 'signup') {
      logStep("Checking if email exists in database for signup", { userEmail });
      
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseServiceKey) {
        logStep("ERROR: SUPABASE_SERVICE_ROLE_KEY missing");
        throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle();

      if (profileError) {
        logStep("ERROR checking existing profile", { error: profileError });
      }

      if (existingProfile) {
        logStep("Email already exists - skipping auth email", { userEmail });
        return new Response(JSON.stringify({ ok: true, message: "Email already registered - no confirmation needed" }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      logStep("Email does not exist - proceeding with auth email", { userEmail });
    }

    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;
    logStep("Confirmation URL generated", { confirmUrlLength: confirmUrl.length });

    const subjectMap: Record<string, string> = {
      signup: "Confirm your email",
      magiclink: "Your magic login link",
      recovery: "Reset your password",
      email_change: "Confirm your email change",
    };

    const subject = subjectMap[email_action_type] || "Authentication link";
    logStep("Email subject determined", { subject, email_action_type });

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h1 style="margin: 0 0 16px; font-size: 22px; color: #111827;">${subject}</h1>
        <p style="margin: 0 0 12px; color: #374151;">Hello${userEmail ? `, ${userEmail}` : ""}!</p>
        <p style="margin: 0 0 16px; color: #374151;">Click the button below to continue.</p>
        <p style="margin: 24px 0;">
          <a href="${confirmUrl}" target="_blank" style="background: #4f46e5; color: white; text-decoration: none; padding: 12px 16px; border-radius: 8px; display: inline-block;">Continue</a>
        </p>
        <p style="margin: 0 0 8px; color: #6b7280;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #111827; font-size: 12px;">${confirmUrl}</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="margin: 0; color: #6b7280; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    logStep("Email HTML template generated", { htmlLength: html.length });

    logStep("Sending email via Resend", { to: userEmail, subject });
    const { error: sendError } = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [userEmail],
      subject,
      html,
    });

    if (sendError) {
      logStep("ERROR: Resend send failed", { error: sendError.message || sendError });
      return new Response(JSON.stringify({ ok: false, error: sendError.message || sendError }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("Email sent successfully", { to: userEmail });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    logStep("ERROR in send-auth-email", { message: err?.message, stack: err?.stack });
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
