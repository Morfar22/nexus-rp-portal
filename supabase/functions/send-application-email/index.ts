import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Resend client is initialized per request to ensure latest secret is used

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  applicationId: string;
  templateType: 'application_submitted' | 'application_approved' | 'application_denied' | 'application_accepted';
  recipientEmail?: string;
  applicantName: string;
  applicationType: string;
  reviewNotes?: string;
  discordName?: string;
  steamName?: string;
  fivemName?: string;
  // Legacy support
  type?: string;
  userEmail?: string;
  applicationData?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SEND APPLICATION EMAIL FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Timestamp:', new Date().toISOString());
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: EmailRequest = await req.json();
    console.log('Email request received:', JSON.stringify(requestBody, null, 2));

    // Handle legacy format for backward compatibility
    if (requestBody.type && requestBody.userEmail) {
      console.log('Processing legacy email request format');
      return handleLegacyRequest(requestBody);
    }

    const { 
      applicationId, 
      templateType, 
      recipientEmail, 
      applicantName, 
      applicationType, 
      reviewNotes, 
      discordName,
      steamName,
      fivemName
    } = requestBody;

    const effectiveTemplateType = templateType === 'application_accepted' ? 'application_approved' : templateType;
    console.log('Processing email for application:', applicationId, 'type:', effectiveTemplateType);

    // Resolve recipient email (fallback to profile or auth.users if not provided)
    let targetEmail = (recipientEmail || '').trim();
    console.log('Initial recipient email:', targetEmail);

    if (!targetEmail) {
      console.log('No recipient email provided, looking up application user...');
      const { data: appRow, error: appError } = await supabase
        .from('applications')
        .select('user_id')
        .eq('id', applicationId)
        .single();

      if (appError || !appRow) {
        console.error('Application lookup failed:', appError);
        return new Response(
          JSON.stringify({ error: 'Application not found', success: false }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const userId = appRow.user_id;
      console.log('Found user ID:', userId);

      // Try custom_users.email first
      const { data: profile, error: profileError } = await supabase
        .from('custom_users')
        .select('email')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Profile lookup error (non-fatal):', profileError);
      }

      if (profile?.email) {
        targetEmail = profile.email;
        console.log('Found email in custom_users:', targetEmail);
      } else {
        console.log('No email in custom_users, trying auth.users...');
        // Fallback to auth.users via Admin API
        const { data: userRes, error: adminErr } = await supabase.auth.admin.getUserById(userId);
        if (adminErr) {
          console.warn('Auth admin getUserById error (non-fatal):', adminErr);
        }
        targetEmail = userRes?.user?.email ?? '';
        console.log('Email from auth.users:', targetEmail);
      }
    }

    if (!targetEmail) {
      console.error('No email found for user; aborting send');
      return new Response(
        JSON.stringify({ error: 'No email found for user', success: false }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Final target email:', targetEmail);

    // Fetch the email template
    console.log('Fetching email template:', effectiveTemplateType);
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', effectiveTemplateType)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      throw new Error(`Email template '${effectiveTemplateType}' not found or inactive`);
    }

    console.log('Found template:', template.subject);

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    // Get the actual form data to extract values
    const actualFormData = await supabase
      .from('applications')
      .select(`
        form_data,
        discord_name,
        steam_name,
        fivem_name,
        application_types!inner(form_fields)
      `)
      .eq('id', applicationId)
      .single();

    let extractedSteamName = steamName;
    let extractedFivemName = fivemName;
    let extractedDiscordName = discordName;
    let extractedApplicantName = applicantName;

    // Extract values from form_data if available
    if (actualFormData.data?.form_data && actualFormData.data?.application_types?.form_fields) {
      const formData = actualFormData.data.form_data;
      let formFields = actualFormData.data.application_types.form_fields;
      
      // Parse form_fields if it's a string
      if (typeof formFields === 'string') {
        try {
          formFields = JSON.parse(formFields);
        } catch (e) {
          console.warn('Failed to parse form_fields:', e);
          formFields = [];
        }
      }

      // Extract values from form_data using field mapping
      if (Array.isArray(formFields)) {
        formFields.forEach((field: any) => {
          const fieldValue = formData[field.id];
          if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim()) {
            if (field.id === 'discord_name' || field.label?.toLowerCase().includes('discord')) {
              extractedDiscordName = fieldValue;
              if (!extractedApplicantName || extractedApplicantName === 'Applicant') {
                extractedApplicantName = fieldValue;
              }
            } else if (field.id === 'steam_name' || field.label?.toLowerCase().includes('steam')) {
              extractedSteamName = fieldValue;
              if (!extractedApplicantName || extractedApplicantName === 'Applicant') {
                extractedApplicantName = fieldValue;
              }
            } else if (field.id === 'fivem_name' || field.label?.toLowerCase().includes('fivem')) {
              extractedFivemName = fieldValue;
            } else if (field.label?.toLowerCase().includes('navn') || field.label?.toLowerCase().includes('name')) {
              if (!extractedApplicantName || extractedApplicantName === 'Applicant') {
                extractedApplicantName = fieldValue;
              }
            }
          }
        });
      }
    }

    // Fallback to direct fields if form_data extraction failed
    if (actualFormData.data?.discord_name && (!extractedDiscordName || !extractedDiscordName.trim())) {
      extractedDiscordName = actualFormData.data.discord_name;
    }
    if (actualFormData.data?.steam_name && (!extractedSteamName || !extractedSteamName.trim())) {
      extractedSteamName = actualFormData.data.steam_name;
    }
    if (actualFormData.data?.fivem_name && (!extractedFivemName || !extractedFivemName.trim())) {
      extractedFivemName = actualFormData.data.fivem_name;
    }

    const replacements = {
      '{{applicant_name}}': extractedApplicantName || applicantName || 'Applicant',
      '{{application_type}}': applicationType || 'Application',
      '{{review_notes}}': reviewNotes || '',
      '{{discord_name}}': extractedDiscordName || '',
      '{{steam_name}}': extractedSteamName || '',
      '{{fivem_name}}': extractedFivemName || '',
      '{{server_name}}': 'Adventurer RP',
      '{{today_date}}': new Date().toLocaleDateString()
    };

    console.log('Replacements to be applied:', JSON.stringify(replacements, null, 2));

    for (const [placeholder, value] of Object.entries(replacements)) {
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value);
      emailBody = emailBody.replace(new RegExp(placeholder, 'g'), value);
    }

    console.log('Final email subject:', emailSubject);
    console.log('Final email body preview:', emailBody.substring(0, 200) + '...');

    // Initialize Resend per request (avoids stale/missing secrets on cold starts)
    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    console.log('Resend API Key available:', !!RESEND_API_KEY);
    
    if (!RESEND_API_KEY) {
      console.log('No RESEND_API_KEY in env, checking server_settings...');
      // Fallback: load from server_settings (service role client)
      try {
        const { data: keyRow } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'resend_api_key')
          .single();
        const val = keyRow?.setting_value;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
        console.log('Resend API Key from server_settings:', !!RESEND_API_KEY);
      } catch (e) {
        console.warn('Failed to load RESEND key from server_settings:', e);
      }
    }
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing from both env and server_settings');
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    console.log('Initializing Resend client...');
    const resend = new Resend(RESEND_API_KEY);

    // Send email via Resend
    console.log('Sending email via Resend to:', targetEmail);
    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [targetEmail],
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
      text: emailBody,
    });

    console.log('Resend response:', JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('✅ Email sent successfully! Email ID:', emailResponse.data?.id);

    // Log the email send
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'email_sent',
        resource_type: 'application',
        resource_id: applicationId,
        new_values: {
          template_type: templateType,
          recipient_email: targetEmail,
          email_id: emailResponse.data?.id
        }
      });

    if (logError) {
      console.error('Failed to log email send:', logError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("❌ ERROR in send-application-email function:", errorMessage);
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

// Legacy handler for backward compatibility
const handleLegacyRequest = async (requestBody: EmailRequest) => {
  try {
    console.log('Processing legacy email request');
    const { type, userEmail, applicationData } = requestBody;
    
    let subject, htmlContent;
    
    if (type === 'approved') {
      subject = "Application Approved - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #22c55e;">🎉 Application Approved!</h1>
          <p>Congratulations! Your application to Adventure rp has been <strong>approved</strong>.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Notes:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>Welcome to our community! You can now join our FiveM server.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    } else if (type === 'denied' || type === 'rejected') {
      subject = "Application Update - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ef4444;">Application Update</h1>
          <p>Thank you for your interest in Adventure rp. Unfortunately, your application has not been approved at this time.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          ${applicationData?.review_notes ? `<p><strong>Staff Feedback:</strong> ${applicationData.review_notes}</p>` : ''}
          <p>You're welcome to submit a new application in the future. Please consider the feedback provided.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    } else {
      subject = "Application Received - Adventure rp";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #ff6b6b;">Application Received!</h1>
          <p>Thank you for your application to Adventure rp.</p>
          <p><strong>Steam Name:</strong> ${applicationData?.steam_name || 'Not provided'}</p>
          <p>We'll review your application and get back to you soon.</p>
          <p>Best regards,<br>The Adventure rp Team</p>
        </div>
      `;
    }

    console.log('Sending legacy email to:', userEmail);
    console.log('Email subject:', subject);

    let RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      try {
        const { data: keyRow } = await createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        ).from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'resend_api_key')
          .single();
        const val = keyRow?.setting_value;
        if (typeof val === 'string') RESEND_API_KEY = val;
        else if (val && typeof val.key === 'string') RESEND_API_KEY = val.key;
      } catch {}
    }
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY', success: false }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const resend = new Resend(RESEND_API_KEY);

    const emailResponse = await resend.emails.send({
      from: "Adventurer RP <noreply@adventurerp.dk>",
      to: [userEmail!],
      subject: subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error('Resend error in legacy handler:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log('Legacy email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Application email sent successfully",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in legacy email handler:', error instanceof Error ? error.message : 'Unknown error');
    throw error; // Re-throw to be caught by main handler
  }
};

serve(handler);