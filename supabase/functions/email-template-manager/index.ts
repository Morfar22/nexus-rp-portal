import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, sessionToken, templateData } = await req.json();

    // Validate session token
    const { data: session, error: sessionError } = await supabase
      .from('custom_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('role, banned')
      .eq('id', session.user_id)
      .single();

    if (userError || !user || user.role !== 'admin' || user.banned) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    switch (action) {
      case 'upsert': {
        const { error: upsertError } = await supabase
          .from('email_templates')
          .upsert({
            template_type: templateData.template_type,
            subject: templateData.subject,
            body: templateData.body,
            is_active: templateData.is_active ?? true,
            created_by: session.user_id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'template_type'
          });

        if (upsertError) throw upsertError;

        return new Response(
          JSON.stringify({ success: true, message: 'Template saved successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fetch': {
        const { data: templates, error: fetchError } = await supabase
          .from('email_templates')
          .select('*')
          .order('template_type');

        if (fetchError) throw fetchError;

        return new Response(
          JSON.stringify({ templates }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in email-template-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
