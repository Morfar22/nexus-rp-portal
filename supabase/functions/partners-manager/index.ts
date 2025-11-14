import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PartnerData {
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  discount_code?: string;
  order_index: number;
  is_active: boolean;
}

async function validateSession(sessionToken: string) {
  console.log('Validating session token...')
  
  const { data: session, error } = await supabase
    .from('custom_sessions')
    .select(`
      user_id,
      expires_at,
      custom_users!inner(
        id,
        role,
        banned
      )
    `)
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    console.error('Session validation error:', error)
    return { error: 'Session not found or expired', user: null }
  }
  
  if (!session) {
    console.log('No session found')
    return { error: 'No session found', user: null }
  }

  console.log('Session found:', {
    user_id: session.user_id,
    expires_at: session.expires_at,
    role: session.custom_users?.role,
    banned: session.custom_users?.banned
  })

  const user = session.custom_users
  if (!user) {
    console.log('No user data in session')
    return { error: 'Invalid session data', user: null }
  }

  if (user.banned) {
    console.log('User is banned')
    return { error: 'User is banned', user: null }
  }

  if (!['admin', 'staff'].includes(user.role)) {
    console.log('User does not have required role:', user.role)
    return { error: `Insufficient permissions. Role: ${user.role}`, user: null }
  }

  console.log('Session validated successfully')
  return { error: null, user }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, sessionToken, data, partnerId } = await req.json()

    console.log('Request received:', { action, hasSessionToken: !!sessionToken, partnerId })

    if (!sessionToken) {
      console.error('No session token provided')
      return new Response(
        JSON.stringify({ error: 'No session token provided' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate session and permissions
    const validation = await validateSession(sessionToken)
    if (validation.error || !validation.user) {
      console.error('Session validation failed:', validation.error)
      return new Response(
        JSON.stringify({ error: validation.error || 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = validation.user

    switch (action) {
      case 'create':
        return await createPartner(data as PartnerData, user.id)
      case 'update':
        return await updatePartner(partnerId, data)
      case 'delete':
        return await deletePartner(partnerId)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createPartner(partnerData: PartnerData, userId: string) {
  try {
    const { error } = await supabase
      .from('partners')
      .insert({
        ...partnerData,
        created_by: userId
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating partner:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updatePartner(partnerId: string, updates: any) {
  try {
    const { created_at, created_by, updated_at, id, ...updateData } = updates

    const { error } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', partnerId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating partner:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deletePartner(partnerId: string) {
  try {
    console.log('Attempting to delete partner:', partnerId)
    
    const { data, error } = await supabase
      .from('partners')
      .delete()
      .eq('id', partnerId)
      .select()

    console.log('Delete result:', { data, error })

    if (error) {
      console.error('Delete error:', error)
      throw error
    }

    console.log('Partner deleted successfully')
    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error deleting partner:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
