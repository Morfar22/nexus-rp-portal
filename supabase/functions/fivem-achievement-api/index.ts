import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fivem-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const fivemToken = Deno.env.get('FIVEM_API_TOKEN')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify FiveM server token
    const authHeader = req.headers.get('x-fivem-token')
    if (!authHeader || authHeader !== fivemToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid FiveM token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      )
    }

    const { action, userId, achievementType, metadata, discordId } = await req.json()

    if (!action) {
      throw new Error('Action is required')
    }

    switch (action) {
      case 'award_achievement': {
        if (!userId && !discordId) {
          throw new Error('Either userId or discordId is required')
        }

        let targetUserId = userId

        // If discordId provided, find the user
        if (!targetUserId && discordId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', discordId)
            .single()
          
          if (!profile) {
            throw new Error('User not found with provided Discord ID')
          }
          targetUserId = profile.id
        }

        // Call the achievement tracker
        const { data, error } = await supabase.functions.invoke('achievement-tracker', {
          body: {
            userId: targetUserId,
            achievementType,
            metadata
          }
        })

        if (error) {
          throw new Error(`Achievement tracker error: ${error.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Achievement processed',
            result: data 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_user_achievements': {
        if (!userId && !discordId) {
          throw new Error('Either userId or discordId is required')
        }

        let targetUserId = userId

        // If discordId provided, find the user
        if (!targetUserId && discordId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('discord_id', discordId)
            .single()
          
          if (!profile) {
            throw new Error('User not found with provided Discord ID')
          }
          targetUserId = profile.id
        }

        const { data: userAchievements, error } = await supabase
          .from('user_achievements')
          .select(`
            *,
            achievements (
              name,
              description,
              icon,
              category,
              points,
              rarity
            )
          `)
          .eq('user_id', targetUserId)

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            achievements: userAchievements || [] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'bulk_award': {
        const { achievements } = await req.json()
        
        if (!Array.isArray(achievements)) {
          throw new Error('Achievements must be an array')
        }

        const results = []
        
        for (const achievement of achievements) {
          try {
            let targetUserId = achievement.userId

            // If discordId provided, find the user
            if (!targetUserId && achievement.discordId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('discord_id', achievement.discordId)
                .single()
              
              if (profile) {
                targetUserId = profile.id
              }
            }

            if (targetUserId) {
              const { data } = await supabase.functions.invoke('achievement-tracker', {
                body: {
                  userId: targetUserId,
                  achievementType: achievement.type,
                  metadata: achievement.metadata || {}
                }
              })
              
              results.push({
                userId: targetUserId,
                achievementType: achievement.type,
                success: true,
                result: data
              })
            } else {
              results.push({
                userId: achievement.userId || achievement.discordId,
                achievementType: achievement.type,
                success: false,
                error: 'User not found'
              })
            }
          } catch (error) {
            results.push({
              userId: achievement.userId || achievement.discordId,
              achievementType: achievement.type,
              success: false,
              error: error.message
            })
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            results 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in FiveM achievement API:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})