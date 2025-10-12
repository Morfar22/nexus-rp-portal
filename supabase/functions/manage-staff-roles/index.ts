import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, userId, newRole, adminUserId } = await req.json()

    console.log('Staff role management request:', { action, userId, newRole, adminUserId })

    // Verify the requesting user is an admin
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('custom_users')
      .select('role, banned')
      .eq('id', adminUserId)
      .single()

    if (adminError || !adminUser) {
      console.error('Admin verification failed:', adminError)
      return new Response(
        JSON.stringify({ error: 'Admin verification failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (adminUser.role !== 'admin' || adminUser.banned) {
      console.error('User is not admin or is banned:', adminUser)
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result
    
    if (action === 'promote') {
      // Promote user to staff role
      const { data, error } = await supabaseClient
        .from('custom_users')
        .update({ role: newRole })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Error promoting user:', error)
        throw error
      }

      result = { success: true, message: `User promoted to ${newRole}`, data }

    } else if (action === 'demote') {
      // Demote user back to regular user
      const { data, error } = await supabaseClient
        .from('custom_users')
        .update({ role: 'user' })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Error demoting user:', error)
        throw error
      }

      result = { success: true, message: 'User demoted to regular user', data }

    } else if (action === 'change_role') {
      // Change existing staff member's role
      const { data, error } = await supabaseClient
        .from('custom_users')
        .update({ role: newRole })
        .eq('id', userId)
        .select()

      if (error) {
        console.error('Error changing role:', error)
        throw error
      }

      result = { success: true, message: `Role changed to ${newRole}`, data }

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Staff role management successful:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Staff role management error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})