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

    const { action, voteId, userId, option, voteData } = await req.json()

    switch (action) {
      case 'cast_vote':
        // Handle vote casting with duplicate prevention
        if (!voteId || !userId || !option) {
          throw new Error('Missing required parameters for casting vote')
        }

        // Check if vote exists and is active
        const { data: vote, error: voteError } = await supabase
          .from('community_votes')
          .select('*')
          .eq('id', voteId)
          .eq('is_active', true)
          .single()

        if (voteError || !vote) {
          throw new Error('Vote not found or inactive')
        }

        // Check if vote period is still active
        const now = new Date()
        const endsAt = new Date(vote.ends_at)
        if (now > endsAt) {
          throw new Error('Voting period has ended')
        }

        // Use upsert to handle both new votes and vote changes
        const { error: upsertError } = await supabase
          .from('community_vote_responses')
          .upsert({
            vote_id: voteId,
            user_id: userId,
            selected_option: option
          }, {
            onConflict: 'vote_id,user_id'
          })

        if (upsertError) throw upsertError

        // Trigger achievement for first vote
        await supabase.functions.invoke('achievement-tracker', {
          body: {
            userId: userId,
            achievementType: 'first_vote',
            metadata: { voteId: voteId }
          }
        })

        return new Response(
          JSON.stringify({ success: true, message: 'Vote cast successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'create_vote':
        // Handle vote creation
        if (!userId || !voteData) {
          throw new Error('Missing required parameters for creating vote')
        }

        const { data: newVote, error: createError } = await supabase
          .from('community_votes')
          .insert({
            ...voteData,
            created_by: userId
          })
          .select()
          .single()

        if (createError) throw createError

        return new Response(
          JSON.stringify({ success: true, vote: newVote }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_vote_stats':
        // Get detailed vote statistics
        if (!voteId) {
          throw new Error('Missing vote ID for statistics')
        }

        const { data: responses, error: statsError } = await supabase
          .from('community_vote_responses')
          .select('selected_option')
          .eq('vote_id', voteId)

        if (statsError) throw statsError

        // Calculate vote counts
        const voteCounts: { [key: string]: number } = {}
        responses?.forEach(response => {
          voteCounts[response.selected_option] = (voteCounts[response.selected_option] || 0) + 1
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            stats: {
              voteCounts,
              totalVotes: responses?.length || 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error in vote manager:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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