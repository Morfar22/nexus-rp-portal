import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BanNotificationRequest {
  userEmail: string;
  userName: string;
  isBanned: boolean;
  banReason?: string;
  staffName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, isBanned, banReason, staffName }: BanNotificationRequest = await req.json();

    console.log(`Processing ${isBanned ? 'ban' : 'unban'} notification for user: ${userEmail}`);

    const subject = isBanned ? "Account Suspended" : "Account Reinstated";
    
    const banEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 10px; color: white;">
          <h1 style="color: #ff6b6b; margin: 0 0 20px 0;">${subject}</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Dear ${userName},
          </p>
          ${isBanned ? `
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your account has been suspended by our moderation team.
            </p>
            ${banReason ? `
              <div style="background: rgba(255, 107, 107, 0.1); border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0;">
                <strong>Reason:</strong> ${banReason}
              </div>
            ` : ''}
            <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
              If you believe this is an error or would like to appeal this decision, please contact our support team.
            </p>
          ` : `
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Great news! Your account has been reinstated and you can now access the application again.
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Welcome back! We appreciate your understanding during this process.
            </p>
          `}
          ${staffName ? `
            <p style="font-size: 14px; color: #a0a0a0; margin: 30px 0 0 0;">
              Action performed by: ${staffName}
            </p>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666;">
          <p style="font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Gaming Community <noreply@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: banEmailHtml,
    });

    console.log("Ban/unban notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ban-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);