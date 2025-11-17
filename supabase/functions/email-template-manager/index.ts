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
    console.log('[EMAIL-TEMPLATE-MANAGER] Request received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('[EMAIL-TEMPLATE-MANAGER] Request body:', JSON.stringify(body));
    
    const { action, sessionToken, templateData } = body;

    // Validate session token
    console.log('[EMAIL-TEMPLATE-MANAGER] Validating session token');
    const { data: session, error: sessionError } = await supabase
      .from('custom_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.log('[EMAIL-TEMPLATE-MANAGER] Session validation failed:', sessionError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[EMAIL-TEMPLATE-MANAGER] Session validated for user:', session.user_id);

    // Verify user is admin
    console.log('[EMAIL-TEMPLATE-MANAGER] Checking user permissions');
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('role, banned')
      .eq('id', session.user_id)
      .single();

    if (userError || !user || user.role !== 'admin' || user.banned) {
      console.log('[EMAIL-TEMPLATE-MANAGER] Permission denied - role:', user?.role, 'banned:', user?.banned);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[EMAIL-TEMPLATE-MANAGER] User authorized as admin');

    // Handle different actions
    console.log('[EMAIL-TEMPLATE-MANAGER] Handling action:', action);
    switch (action) {
      case 'upsert': {
        console.log('[EMAIL-TEMPLATE-MANAGER] Upserting template:', templateData.template_type);
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

        if (upsertError) {
          console.log('[EMAIL-TEMPLATE-MANAGER] Upsert error:', upsertError);
          throw upsertError;
        }

        console.log('[EMAIL-TEMPLATE-MANAGER] Template saved successfully');
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
