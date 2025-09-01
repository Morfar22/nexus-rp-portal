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
      throw new Error('User ID is required')
    }

    console.log('Force logout request for user:', userId)

    // Use admin client to sign out all sessions for the user
    const { error } = await supabaseAdmin.auth.admin.signOut(userId, 'global')
    
    if (error) {
      console.error('Error signing out user:', error)
      throw error
    }

    console.log('Successfully signed out user:', userId)

    // Log the admin action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'force_logout',
        resource_type: 'user',
        resource_id: userId,
        user_id: null, // Will be filled by RLS if admin is authenticated
        new_values: { action: 'force_logout', target_user: userId }
      })

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