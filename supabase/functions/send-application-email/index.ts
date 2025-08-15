import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  type: 'submission' | 'approved' | 'denied' | 'under_review' | 'staff_notification';
  userEmail?: string;
  userId?: string;
  applicationData: {
    steam_name: string;
    discord_tag: string;
    fivem_name: string;
    status?: string;
    review_notes?: string;
  };
  staffEmail?: string;
}

const getEmailTemplate = (type: string, data: any) => {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e1e5e9; border-top: none; }
      .status-badge { padding: 6px 12px; border-radius: 4px; font-weight: bold; display: inline-block; margin: 8px 0; }
      .approved { background: #d4edda; color: #155724; }
      .denied { background: #f8d7da; color: #721c24; }
      .under-review { background: #fff3cd; color: #856404; }
    </style>
  `;

  switch (type) {
    case 'submission':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🎮 Application Received!</h1>
            <p>Thank you for applying to Nexus RP</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.steam_name || 'Applicant'}</strong>,</p>
            <p>We've successfully received your application for Nexus RP. Our staff team will review your application and get back to you soon.</p>
            <h3>📋 Application Details:</h3>
            <ul>
              <li><strong>Steam Name:</strong> ${data.steam_name || 'Not provided'}</li>
              <li><strong>Discord:</strong> ${data.discord_tag || 'Not provided'}</li>
              <li><strong>FiveM Name:</strong> ${data.fivem_name || 'Not provided'}</li>
            </ul>
            <p>Please be patient while we review your application. We'll send you an email with the decision within 48 hours.</p>
          </div>
          <div class="footer">
            <p>Thank you for your interest in Nexus RP!</p>
            <p><strong>The Nexus RP Team</strong></p>
          </div>
        </div>
      `;

    case 'approved':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Nexus RP!</h1>
            <p>Your application has been approved</p>
          </div>
          <div class="content">
            <div class="status-badge approved">✅ APPROVED</div>
            <p>Congratulations <strong>${data.steam_name}</strong>!</p>
            <p>Your application has been approved and you're now part of the Nexus RP community!</p>
            <h3>🚀 Next Steps:</h3>
            <ol>
              <li>Join our Discord server for important updates</li>
              <li>Read through our server rules carefully</li>
              <li>Connect to the server and start your roleplay journey</li>
            </ol>
            <p>Welcome to the family! We're excited to see what stories you'll create.</p>
          </div>
          <div class="footer">
            <p>Welcome aboard!</p>
            <p><strong>The Nexus RP Team</strong></p>
          </div>
        </div>
      `;

    case 'denied':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📋 Application Update</h1>
            <p>Regarding your Nexus RP application</p>
          </div>
          <div class="content">
            <div class="status-badge denied">❌ NOT APPROVED</div>
            <p>Hello <strong>${data.steam_name}</strong>,</p>
            <p>Thank you for your interest in Nexus RP. After careful review, we've decided not to approve your application at this time.</p>
            ${data.review_notes ? `<h3>📝 Feedback:</h3><p>${data.review_notes}</p>` : ''}
            <p>We encourage you to review our rules and requirements, and you're welcome to reapply in the future.</p>
          </div>
          <div class="footer">
            <p>Thank you for your understanding</p>
            <p><strong>The Nexus RP Team</strong></p>
          </div>
        </div>
      `;

    case 'under_review':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🔍 Application Under Review</h1>
            <p>We're reviewing your application</p>
          </div>
          <div class="content">
            <div class="status-badge under-review">⏳ UNDER REVIEW</div>
            <p>Hello <strong>${data.steam_name}</strong>,</p>
            <p>Your application is currently being reviewed by our staff team. We may need additional information or clarification.</p>
            ${data.review_notes ? `<h3>📝 Additional Notes:</h3><p>${data.review_notes}</p>` : ''}
            <p>Please be patient while we complete our review process. We'll update you as soon as we have more information.</p>
          </div>
          <div class="footer">
            <p>Thank you for your patience</p>
            <p><strong>The Nexus RP Team</strong></p>
          </div>
        </div>
      `;

    case 'staff_notification':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📋 New Application Submitted</h1>
            <p>Staff Notification</p>
          </div>
          <div class="content">
            <p>A new application has been submitted and requires review.</p>
            <h3>📋 Application Details:</h3>
            <ul>
              <li><strong>Steam Name:</strong> ${data.steam_name || 'Not provided'}</li>
              <li><strong>Discord:</strong> ${data.discord_tag || 'Not provided'}</li>
              <li><strong>FiveM Name:</strong> ${data.fivem_name || 'Not provided'}</li>
              <li><strong>Applicant Email:</strong> ${data.toEmail || 'Not provided'}</li>
            </ul>
            <p>Please review this application in the staff panel.</p>
          </div>
          <div class="footer">
            <p><strong>Nexus RP Staff System</strong></p>
          </div>
        </div>
      `;

    default:
      return '<p>Invalid email type</p>';
  }
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log('OPTIONS request received for CORS preflight');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    console.log('=== EMAIL FUNCTION START ===');
    
    // Check if RESEND_API_KEY exists before proceeding
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Resend client here to catch initialization errors
    const resendClient = new Resend(apiKey);

    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { type, userEmail, userId, applicationData, staffEmail }: EmailRequest = await req.json();

    console.log('Request data:', { type, userEmail, userId, applicationData, staffEmail });

    let recipientEmail = userEmail;
    
    // If no email provided but userId is available, fetch from auth
    if (!recipientEmail && userId) {
      console.log('Fetching user email for userId:', userId);
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        console.log('User fetch result:', { userData: !!userData?.user, error: userError });
        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error(`Failed to fetch user: ${userError.message}`);
        }
        recipientEmail = userData?.user?.email;
      } catch (fetchError) {
        console.error('Error in user fetch block:', fetchError);
        throw fetchError;
      }
    }

    const toEmail = type === 'staff_notification' ? staffEmail : recipientEmail;
    
    if (!toEmail) {
      console.error('No recipient email found');
      throw new Error('No recipient email available');
    }

    // Generate subject and template
    let subject = '';
    switch (type) {
      case 'submission':
        subject = 'Application Received - Nexus RP Portal';
        break;
      case 'approved':
        subject = 'Application Approved - Welcome to Nexus RP!';
        break;
      case 'denied':
        subject = 'Application Update - Nexus RP Portal';
        break;
      case 'under_review':
        subject = 'Application Under Review - Nexus RP Portal';
        break;
      case 'staff_notification':
        subject = 'New Application Submitted - Nexus RP Portal';
        break;
      default:
        subject = 'Nexus RP Portal Notification';
    }

    const html = getEmailTemplate(type, { ...applicationData, toEmail });

    console.log('About to send email to:', toEmail);
    console.log('Email HTML length:', html.length);

    const emailResponse = await resendClient.emails.send({
      from: "Nexus RP Portal <noreply@mmorfar.dk>",
      to: [toEmail],
      subject,
      html,
    });

    console.log("Email sent successfully via Resend:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== EMAIL FUNCTION ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Always return CORS headers even on error
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);