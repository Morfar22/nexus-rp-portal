import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log('OPTIONS request received');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    console.log('Email function called');
    
    // Check API key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('API key found, initializing Resend');
    const resend = new Resend(apiKey);

    const body = await req.json();
    console.log('Request body:', body);

    const { type, userEmail, applicationData } = body;

    // Simple email template
    const subject = 'Application Received - Nexus RP Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Application Received!</h1>
        <p>Thank you for your application to Nexus RP.</p>
        <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
        <p>We'll review your application and get back to you soon.</p>
        <p>Best regards,<br>The Nexus RP Team</p>
      </div>
    `;

    console.log('Sending email to:', userEmail);

    const emailResponse = await resend.emails.send({
      from: "Nexus RP Portal <noreply@mmorfar.dk>",
      to: [userEmail],
      subject: subject,
      html: html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Email function error:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);