import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PackageData {
  name: string
  description?: string
  price_amount: number
  currency: string
  interval: string
  features: any
  is_active: boolean
  order_index: number
  image_url?: string
}

async function validateSession(sessionToken: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  console.log('Validating session token:', sessionToken?.substring(0, 10) + '...')

  const { data: sessionData, error } = await supabase
    .from('custom_sessions')
    .select(`
      user_id,
      custom_users!inner (
        id,
        role,
        banned
      )
    `)
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !sessionData) {
    console.error('Session validation error:', error)
    throw new Error('Invalid session')
  }

  const user = sessionData.custom_users
  console.log('User found:', { id: user.id, role: user.role, banned: user.banned })

  if (user.banned) {
    throw new Error('User is banned')
  }

  // Check if user has admin or staff role, or specific package management permissions
  if (user.role === 'admin' || user.role === 'staff') {
    return user
  }

  // For custom role system, check specific permissions
  const { data: permissions, error: permError } = await supabase
    .from('user_role_assignments')
    .select(`
      staff_roles!inner (
        role_permissions!inner (
          permissions!inner (
            name
          )
        )
      )
    `)
    .eq('user_id', user.id)

  if (!permError && permissions) {
    const hasPackagePermission = permissions.some(assignment => 
      assignment.staff_roles.role_permissions.some(rp => 
        rp.permissions.name === 'subscription.manage' || 
        rp.permissions.name === 'server.manage'
      )
    )
    
    if (hasPackagePermission) {
      return user
    }
  }

  throw new Error('Insufficient permissions - requires admin, staff role or subscription management permissions')
}

async function createPackage(packageData: PackageData) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data, error } = await supabase
    .from('packages')
    .insert([packageData])
    .select()
    .single()

  if (error) throw error
  return data
}

async function updatePackage(packageId: string, updates: Partial<PackageData>) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data, error } = await supabase
    .from('packages')
    .update(updates)
    .eq('id', packageId)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deletePackage(packageId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', packageId)

  if (error) throw error
  return { success: true }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request text first to check if it's valid
    const requestText = await req.text()
    console.log('Raw request body:', requestText)
    
    if (!requestText || requestText.trim() === '') {
      throw new Error('Empty request body')
    }

    let requestData
    try {
      requestData = JSON.parse(requestText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { action, sessionToken, data, packageId } = requestData

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Session token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate session and permissions
    const user = await validateSession(sessionToken)

    let result

    switch (action) {
      case 'create':
        if (!data) {
          return new Response(JSON.stringify({ error: 'Package data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        result = await createPackage(data)
        break

      case 'update':
        if (!packageId || !data) {
          return new Response(JSON.stringify({ error: 'Package ID and update data required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        result = await updatePackage(packageId, data)
        break

      case 'delete':
        if (!packageId) {
          return new Response(JSON.stringify({ error: 'Package ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        result = await deletePackage(packageId)
        break

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Package manager error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Invalid session' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})