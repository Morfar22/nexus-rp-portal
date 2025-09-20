import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId } = await req.json()

    if (!userId) {
      console.error('Missing userId in request')
      return new Response(
        JSON.stringify({ 
          error: 'User ID is required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Force logout request for user:', userId)

    // Delete all custom sessions for the user (custom auth system)
    const { error: customSessionError } = await supabaseAdmin
      .from('custom_sessions')
      .delete()
      .eq('user_id', userId)
    
    if (customSessionError) {
      console.error('Error deleting custom sessions:', customSessionError)
      // Don't throw error here - user might not have custom sessions
    } else {
      console.log('Successfully deleted custom sessions for user:', userId)
    }

    // Also try to sign out from Supabase auth system if user exists there
    try {
      await supabaseAdmin.auth.admin.signOut(userId, 'global')
      console.log('Also signed out from Supabase auth system')
    } catch (authError) {
      // This is expected for custom auth users, so we don't throw
      console.log('User not in Supabase auth system (custom auth user):', authError.message)
    }

    console.log('Successfully force logged out user:', userId)

    // Log the admin action
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          action: 'force_logout',
          resource_type: 'user',
          resource_id: userId,
          user_id: null, // Will be filled by RLS if admin is authenticated
          new_values: { action: 'force_logout', target_user: userId }
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the entire operation for audit log issues
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User has been logged out successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Force logout error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to logout user' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})