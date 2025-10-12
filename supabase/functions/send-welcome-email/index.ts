import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
  siteUrl?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  logStep("Function started", { method: req.method, url: req.url });
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    logStep("CORS preflight handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    let SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    logStep("Environment variables loaded", { hasResendKey: !!RESEND_API_KEY, hasSupabaseUrl: !!SUPABASE_URL, hasServiceRole: !!SERVICE_ROLE });

    // Fallback: if RESEND_API_KEY missing, try server_settings
    if (!RESEND_API_KEY) {
      logStep("RESEND_API_KEY not found in env, checking database");
      try {
        const tmpClient = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { data: keyRow } = await tmpClient
          .from("server_settings")
          .select("setting_value")
          .eq("setting_key", "resend_api_key")
          .single();
        const val = keyRow?.setting_value as any;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
        logStep("Database fallback key check", { found: !!RESEND_API_KEY });
      } catch (e) {
        logStep("RESEND key fallback read failed", { error: e });
      }
    }

    if (!RESEND_API_KEY) {
      logStep("ERROR: RESEND_API_KEY missing");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const resend = new Resend(RESEND_API_KEY);
    logStep("Clients initialized successfully");

    const body = (await req.json()) as WelcomeEmailRequest;
    const { email, username, siteUrl } = body;
    logStep("Request body parsed", { email, username: !!username, siteUrl: !!siteUrl });

    if (!email) {
      logStep("ERROR: Email is required but missing");
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to load a template from DB first
    let subject = "Welcome to Adventure rp!";
    let content = `Welcome ${username ?? "there"}!\n\nYour account has been created.\n\nNext steps:\n- Join our Discord\n- Read the rules\n- Start your RP journey!\n\nSee you in the city!`;
    logStep("Default template loaded", { subject, contentLength: content.length });

    try {
      logStep("Fetching email template from database");
      const { data: template, error: tplErr } = await supabase
        .from("email_templates")
        .select("subject, body")
        .eq("template_type", "welcome")
        .eq("is_active", true)
        .single();

      if (!tplErr && template) {
        subject = template.subject;
        content = template.body
          .replace(/\{\{username\}\}/g, username ?? "Player")
          .replace(/\{\{email\}\}/g, email)
          .replace(/\{\{registration_date\}\}/g, new Date().toLocaleDateString());
        logStep("Template loaded from database and processed", { subject, contentLength: content.length });
      } else if (tplErr) {
        logStep("No welcome template found, using fallback", { error: tplErr.message });
      }
    } catch (e) {
      logStep("Template fetch error (fallback used)", { error: e });
    }

    const html = content.replace(/\n/g, "<br>");
    logStep("HTML conversion completed", { htmlLength: html.length });

    logStep("Sending email via Resend", { to: email, subject });
    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [email],
      subject,
      html,
      text: content,
    });

    if (emailResponse.error) {
      logStep("ERROR: Resend email failed", { error: emailResponse.error });
      throw new Error(emailResponse.error.message);
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    // Best-effort audit log
    try {
      logStep("Creating audit log entry");
      await supabase.from("audit_logs").insert({
        action: "email_sent",
        resource_type: "auth",
        resource_id: email,
        new_values: { template_type: "welcome", email_id: emailResponse.data?.id },
      });
      logStep("Audit log created successfully");
    } catch (e) {
      logStep("Audit log creation failed", { error: e });
    }

    logStep("Welcome email process completed successfully", { emailId: emailResponse.data?.id });
    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR in send-welcome-email", { message: error?.message, stack: error?.stack });
    return new Response(JSON.stringify({ success: false, error: error?.message ?? String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
