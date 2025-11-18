import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, sessionToken, ruleData, ruleId } = await req.json()
    console.log('[RULES-MANAGER] Request:', { action, ruleId: ruleId || 'N/A' })

    // Validate session
    const { data: sessionData, error: sessionError } = await supabase
      .from('custom_sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      console.log('[RULES-MANAGER] Invalid session')
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has permission
    const { data: userData } = await supabase
      .from('custom_users')
      .select('role, banned')
      .eq('id', sessionData.user_id)
      .single()

    if (!userData || userData.banned || !['admin', 'staff', 'moderator'].includes(userData.role)) {
      console.log('[RULES-MANAGER] Insufficient permissions')
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'fetch': {
        console.log('[RULES-MANAGER] Fetching rules')
        const { data: rules, error: fetchError } = await supabase
          .from('rules')
          .select('*')
          .order('category', { ascending: true })
          .order('order_index', { ascending: true })

        if (fetchError) {
          console.log('[RULES-MANAGER] Fetch error:', fetchError)
          throw fetchError
        }

        console.log('[RULES-MANAGER] Rules fetched:', rules?.length || 0)
        return new Response(
          JSON.stringify({ rules }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create': {
        console.log('[RULES-MANAGER] Creating rule')
        const { error: createError } = await supabase
          .from('rules')
          .insert({
            ...ruleData,
            created_by: sessionData.user_id
          })

        if (createError) {
          console.log('[RULES-MANAGER] Create error:', createError)
          throw createError
        }

        console.log('[RULES-MANAGER] Rule created successfully')
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update': {
        console.log('[RULES-MANAGER] Updating rule:', ruleId)
        const { error: updateError } = await supabase
          .from('rules')
          .update(ruleData)
          .eq('id', ruleId)

        if (updateError) {
          console.log('[RULES-MANAGER] Update error:', updateError)
          throw updateError
        }

        console.log('[RULES-MANAGER] Rule updated successfully')
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete': {
        console.log('[RULES-MANAGER] Deleting rule:', ruleId)
        const { error: deleteError } = await supabase
          .from('rules')
          .delete()
          .eq('id', ruleId)

        if (deleteError) {
          console.log('[RULES-MANAGER] Delete error:', deleteError)
          throw deleteError
        }

        console.log('[RULES-MANAGER] Rule deleted successfully')
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[RULES-MANAGER] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
