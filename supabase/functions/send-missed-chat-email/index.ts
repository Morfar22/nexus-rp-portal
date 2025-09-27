import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface MissedChatEmailRequest {
  userId: string;
  sessionId: string;
  visitorName: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, sessionId, visitorName, message }: MissedChatEmailRequest = await req.json();
    
    console.log('Sending missed chat email:', { userId, sessionId, visitorName });

    // Get staff member's profile
    const { data: staffProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, username')
      .eq('id', userId)
      .single();

    if (profileError || !staffProfile?.email) {
      console.error('Error fetching staff profile:', profileError);
      throw new Error('Staff profile not found');
    }

    // Get session details for more context
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('created_at, visitor_email, status')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session details:', sessionError);
    }

    // Get message count for this session
    const { count: messageCount } = await supabaseClient
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .eq('session_id', sessionId);

    const createdAt = session?.created_at ? new Date(session.created_at) : new Date();
    const waitTime = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60)); // minutes

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Missed Chat Alert</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 10px;
              border-left: 4px solid #ff6b35;
            }
            .header {
              background: #ff6b35;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              margin: -30px -30px 20px -30px;
            }
            .alert-badge {
              background: #ff4444;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .session-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #eee;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              padding: 5px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              color: #333;
            }
            .action-button {
              display: inline-block;
              background: #ff6b35;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="alert-badge">🚨 Missed Chat Alert</div>
              <h1 style="margin: 10px 0 0 0; font-size: 24px;">Live Chat Requires Attention</h1>
            </div>
            
            <p>Hello <strong>${staffProfile.username}</strong>,</p>
            
            <p>A visitor has been waiting for assistance in the live chat system but hasn't received a response yet.</p>
            
            <div class="session-details">
              <h3 style="margin-top: 0; color: #ff6b35;">Session Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Visitor Name:</span>
                <span class="detail-value"><strong>${visitorName}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Session ID:</span>
                <span class="detail-value">${sessionId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Wait Time:</span>
                <span class="detail-value"><strong>${waitTime} minutes</strong></span>
              </div>
              
              ${session?.visitor_email ? `
              <div class="detail-row">
                <span class="detail-label">Visitor Email:</span>
                <span class="detail-value">${session.visitor_email}</span>
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Message Count:</span>
                <span class="detail-value">${messageCount || 0} messages</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Started At:</span>
                <span class="detail-value">${createdAt.toLocaleString()}</span>
              </div>
              
              ${message ? `
              <div class="detail-row">
                <span class="detail-label">Latest Message:</span>
                <span class="detail-value">"${message}"</span>
              </div>
              ` : ''}
            </div>
            
            <p><strong>Action Required:</strong> Please log in to the staff panel and respond to this chat session as soon as possible to provide excellent customer service.</p>
            
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'https://your-app.vercel.app'}/staff" class="action-button">
              Open Staff Panel →
            </a>
            
            <div class="footer">
              <p>This is an automated notification from your live chat system.</p>
              <p>If you're currently unavailable, please ensure another staff member can handle the chat or update your availability status.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'Chat System <noreply@resend.dev>',
      to: [staffProfile.email],
      subject: `🚨 Missed Chat Alert - ${visitorName} waiting ${waitTime} minutes`,
      html: emailHtml
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('Missed chat email sent successfully:', emailResponse.data);

    // Log the notification in the database
    await supabaseClient
      .from('chat_analytics')
      .insert({
        session_id: sessionId,
        metric_type: 'email_notification_sent',
        metric_value: 1,
        metadata: {
          recipient: staffProfile.email,
          visitor_name: visitorName,
          wait_time_minutes: waitTime,
          message_count: messageCount,
          email_id: emailResponse.data?.id
        }
      });

    return new Response(
      JSON.stringify({ 
        message: 'Missed chat email sent successfully',
        emailId: emailResponse.data?.id,
        recipient: staffProfile.email,
        waitTime: waitTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-missed-chat-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});