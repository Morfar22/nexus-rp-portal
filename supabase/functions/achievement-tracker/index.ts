import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { userId, achievementType, metadata } = await req.json()

    if (!userId || !achievementType) {
      throw new Error('Missing required parameters')
    }

    // Check for specific achievement triggers
    let achievementId = null

    switch (achievementType) {
      case 'first_character':
        // Award achievement for creating first character
        const { data: firstCharAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', 'Character Creator')
          .single()
        
        if (firstCharAchievement) {
          achievementId = firstCharAchievement.id
        }
        break

      case 'first_vote':
        // Award achievement for casting first vote
        const { data: firstVoteAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', 'First Vote')
          .single()
        
        if (firstVoteAchievement) {
          achievementId = firstVoteAchievement.id
        }
        break

      case 'event_participant':
        // Award achievement for participating in events
        const { data: eventAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', 'Event Participant')
          .single()
        
        if (eventAchievement) {
          achievementId = eventAchievement.id
        }
        break

      case 'community_contributor':
        // Award achievement for community contributions
        const { data: contributorAchievement } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', 'Community Contributor')
          .single()
        
        if (contributorAchievement) {
          achievementId = contributorAchievement.id
        }
        break
    }

    if (achievementId) {
      // Check if user already has this achievement
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single()

      if (!existingAchievement) {
        // Award the achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            progress: metadata || {}
          })

        if (insertError) {
          console.error('Error awarding achievement:', insertError)
        } else {
          console.log(`Achievement ${achievementType} awarded to user ${userId}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, achievementAwarded: !!achievementId }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in achievement tracker:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})