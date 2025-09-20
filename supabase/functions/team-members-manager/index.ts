import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TeamMemberData {
  name: string;
  staff_role_id: string;
  bio?: string;
  image_url?: string;
  location?: string;
  order_index: number;
  is_active: boolean;
}

async function validateSession(sessionToken: string) {
  const { data: session, error } = await supabase
    .from('custom_sessions')
    .select(`
      user_id,
      custom_users!inner(
        id,
        role,
        banned
      )
    `)
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  const user = session.custom_users
  if (user.banned || !['admin', 'staff'].includes(user.role)) {
    return null
  }

  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, sessionToken, data, memberId } = await req.json()

    // Validate session and permissions
    const user = await validateSession(sessionToken)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'create':
        return await createTeamMember(data as TeamMemberData)
      case 'update':
        return await updateTeamMember(memberId, data)
      case 'delete':
        return await deleteTeamMember(memberId)
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

async function createTeamMember(memberData: TeamMemberData) {
  try {
    // Get role display name for the role field
    const { data: staffRole, error: roleError } = await supabase
      .from('staff_roles')
      .select('display_name')
      .eq('id', memberData.staff_role_id)
      .single()

    if (roleError || !staffRole) {
      return new Response(
        JSON.stringify({ error: 'Invalid staff role' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase
      .from('team_members')
      .insert({
        ...memberData,
        role: staffRole.display_name
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating team member:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updateTeamMember(memberId: string, updates: any) {
  try {
    const { staff_roles, created_at, updated_at, id, ...updateData } = updates

    // If staff_role_id is being updated, also update the role field
    if (updateData.staff_role_id) {
      const { data: staffRole, error: roleError } = await supabase
        .from('staff_roles')
        .select('display_name')
        .eq('id', updateData.staff_role_id)
        .single()

      if (roleError || !staffRole) {
        return new Response(
          JSON.stringify({ error: 'Invalid staff role' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      updateData.role = staffRole.display_name
    }

    const { error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error updating team member:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteTeamMember(memberId: string) {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error deleting team member:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}