import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
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
            <h1>Application Submitted</h1>
          </div>
          <div class="content">
            <h2>Thank you for your application!</h2>
            <p>Hi <strong>${data.steam_name}</strong>,</p>
            <p>We've received your whitelist application for our FiveM server. Here are the details we have on file:</p>
            <ul>
              <li><strong>Steam Name:</strong> ${data.steam_name}</li>
              <li><strong>Discord Tag:</strong> ${data.discord_tag}</li>
              <li><strong>FiveM Name:</strong> ${data.fivem_name}</li>
            </ul>
            <p>Our staff team will review your application and get back to you soon. You'll receive an email notification once a decision has been made.</p>
            <p>Thank you for your interest in joining our community!</p>
          </div>
          <div class="footer">
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `;

    case 'approved':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🎉 Application Approved!</h1>
          </div>
          <div class="content">
            <h2>Welcome to the community!</h2>
            <p>Hi <strong>${data.steam_name}</strong>,</p>
            <p>Congratulations! Your whitelist application has been <span class="status-badge approved">APPROVED</span>.</p>
            <p>You can now join our FiveM server and start your roleplay journey with us.</p>
            ${data.review_notes ? `<p><strong>Staff Notes:</strong> ${data.review_notes}</p>` : ''}
            <p>Welcome to the community, and we look forward to seeing you in-game!</p>
          </div>
          <div class="footer">
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `;

    case 'denied':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Application Update</h1>
          </div>
          <div class="content">
            <h2>Application Status Update</h2>
            <p>Hi <strong>${data.steam_name}</strong>,</p>
            <p>Thank you for your interest in joining our FiveM server. After careful review, your application has been <span class="status-badge denied">DENIED</span>.</p>
            ${data.review_notes ? `<p><strong>Reason:</strong> ${data.review_notes}</p>` : ''}
            <p>You're welcome to submit a new application in the future. Please make sure to read our rules and guidelines carefully before reapplying.</p>
          </div>
          <div class="footer">
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `;

    case 'under_review':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>Application Under Review</h1>
          </div>
          <div class="content">
            <h2>Application Status Update</h2>
            <p>Hi <strong>${data.steam_name}</strong>,</p>
            <p>Your whitelist application is currently <span class="status-badge under-review">UNDER REVIEW</span>.</p>
            <p>Our staff team is taking a closer look at your application. We'll notify you once a final decision has been made.</p>
            ${data.review_notes ? `<p><strong>Staff Notes:</strong> ${data.review_notes}</p>` : ''}
            <p>Thank you for your patience!</p>
          </div>
          <div class="footer">
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      `;

    case 'staff_notification':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>New Application Submitted</h1>
          </div>
          <div class="content">
            <h2>Staff Notification</h2>
            <p>A new whitelist application has been submitted and requires review:</p>
            <ul>
              <li><strong>Steam Name:</strong> ${data.steam_name}</li>
              <li><strong>Discord Tag:</strong> ${data.discord_tag}</li>
              <li><strong>FiveM Name:</strong> ${data.fivem_name}</li>
            </ul>
            <p>Please log in to the staff panel to review and process this application.</p>
          </div>
          <div class="footer">
            <p><small>This is an automated staff notification.</small></p>
          </div>
        </div>
      `;

    default:
      return '<p>Invalid email type</p>';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EMAIL FUNCTION START ===');
    const { type, userEmail, userId, applicationData, staffEmail }: EmailRequest = await req.json();

    console.log('Request data:', { type, userEmail, userId, applicationData, staffEmail });
    console.log('RESEND_API_KEY exists:', !!Deno.env.get("RESEND_API_KEY"));
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    let recipientEmail = userEmail;
    
    // If no email provided but userId is available, fetch from auth
    if (!recipientEmail && userId) {
      console.log('Fetching user email for userId:', userId);
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        console.log('User fetch result:', { userData: !!userData?.user, error: userError });
        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error('Failed to fetch user email: ' + userError.message);
        }
        recipientEmail = userData.user?.email;
        console.log('Fetched user email:', recipientEmail);
      } catch (authError) {
        console.error('Error with admin auth:', authError);
        throw new Error('Unable to access user email: ' + authError.message);
      }
    }

    if (!recipientEmail) {
      console.error('No recipient email available');
      throw new Error('No recipient email available');
    }

    console.log('Final recipient email:', recipientEmail);

    const subject = {
      submission: "Application Submitted - FiveM Server",
      approved: "🎉 Application Approved - Welcome!",
      denied: "Application Update - FiveM Server", 
      under_review: "Application Under Review - FiveM Server",
      staff_notification: "New Application Requires Review"
    }[type];

    console.log('Email subject:', subject);

    const html = getEmailTemplate(type, applicationData);
    const toEmail = type === 'staff_notification' ? (staffEmail || 'staff@yourdomain.com') : recipientEmail;

    console.log('About to send email to:', toEmail);
    console.log('Email HTML length:', html.length);

    const emailResponse = await resend.emails.send({
      from: "FiveM Server <onboarding@resend.dev>",
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