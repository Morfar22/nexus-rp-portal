import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for missed chats...');

    // Get notification settings
    const { data: notificationSettings } = await supabaseClient
      .from('server_settings')
      .select('setting_value')
      .eq('setting_key', 'notification_settings')
      .single();

    const timeoutMinutes = notificationSettings?.setting_value?.missed_chat_timeout || 5;
    console.log('Using missed chat timeout:', timeoutMinutes, 'minutes');

    // Find sessions that have been waiting too long
    const { data: waitingSessions, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select(`
        id, 
        visitor_name, 
        visitor_email, 
        created_at,
        user_id
      `)
      .eq('status', 'waiting')
      .lt('created_at', new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString());

    if (sessionError) {
      console.error('Error fetching waiting sessions:', sessionError);
      throw sessionError;
    }

    console.log('Found waiting sessions:', waitingSessions?.length || 0);

    if (!waitingSessions || waitingSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No missed chats found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which sessions haven't been marked as missed yet
    const sessionIds = waitingSessions.map(s => s.id);
    const { data: existingMissed } = await supabaseClient
      .from('missed_chats')
      .select('session_id')
      .in('session_id', sessionIds);

    const existingMissedIds = new Set(existingMissed?.map(m => m.session_id) || []);
    const newMissedSessions = waitingSessions.filter(s => !existingMissedIds.has(s.id));

    console.log('New missed sessions to process:', newMissedSessions.length);

    let processedCount = 0;
    let emailsSent = 0;

    // Process each new missed session
    for (const session of newMissedSessions) {
      try {
        const waitTimeMinutes = Math.round((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60));
        
        // Create missed chat record
        const { error: insertError } = await supabaseClient
          .from('missed_chats')
          .insert({
            session_id: session.id,
            wait_time_minutes: waitTimeMinutes
          });

        if (insertError) {
          console.error('Error inserting missed chat record:', insertError);
          continue;
        }

        // Log analytics
        await supabaseClient
          .from('chat_analytics')
          .insert({
            session_id: session.id,
            metric_type: 'missed_chat',
            metric_value: 1,
            metadata: {
              wait_time_minutes: waitTimeMinutes,
              visitor_name: session.visitor_name,
              visitor_email: session.visitor_email
            }
          });

        // Get all staff members for email notifications
        const { data: staffMembers } = await supabaseClient
          .from('profiles')
          .select('id, email, username')
          .neq('email', null);

        if (staffMembers && staffMembers.length > 0) {
          // Send email to all staff members
          for (const staff of staffMembers) {
            try {
              const { error: emailError } = await supabaseClient.functions.invoke('send-missed-chat-email', {
                body: {
                  userId: staff.id,
                  sessionId: session.id,
                  visitorName: session.visitor_name,
                  message: `Visitor has been waiting for ${waitTimeMinutes} minutes`
                }
              });

              if (!emailError) {
                emailsSent++;
              }
            } catch (emailError) {
              console.error('Error sending email to staff member:', staff.email, emailError);
            }
          }
        }

        processedCount++;
      } catch (error) {
        console.error('Error processing session:', session.id, error);
      }
    }

    console.log(`Processed ${processedCount} missed chats, sent ${emailsSent} emails`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${processedCount} missed chats`,
        processedCount,
        emailsSent,
        timeoutMinutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-missed-chats:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});