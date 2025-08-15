import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userEmail, applicationData } = await req.json();
    
    console.log('Email function called with:', { type, userEmail, applicationData });
    
    // Check if API key exists
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not found');
    }
    
    console.log('API key found:', apiKey.substring(0, 10) + '...');

    const emailResponse = await resend.emails.send({
      from: "Nexus RP Portal <noreply@mmorfar.dk>",
      to: [userEmail],
      subject: "Application Received - Nexus RP Portal",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ff6b6b;">Application Received!</h1>
          <p>Thank you for your application to Nexus RP.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          <p>We'll review your application and get back to you soon.</p>
          <p>Best regards,<br>The Nexus RP Team</p>
        </div>
      `,
    });

    console.log("Application email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Application email sent successfully',
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);