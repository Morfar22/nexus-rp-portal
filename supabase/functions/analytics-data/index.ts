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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { metric, type } = await req.json()

    // Support both 'metric' and 'type' parameter names
    const requestedMetric = metric || type

    let data = {}

    switch (requestedMetric) {
      case 'chat_analytics':
        // Mock chat analytics data for the enhanced dashboard
        data = {
          totalSessions: 127,
          activeSessions: 3,
          avgResponseTime: 45,
          satisfactionScore: 4.2,
          resolutionRate: 87,
          dailyStats: [
            { date: '2025-09-15', sessions: 15 },
            { date: '2025-09-16', sessions: 22 },
            { date: '2025-09-17', sessions: 18 },
            { date: '2025-09-18', sessions: 31 },
            { date: '2025-09-19', sessions: 25 },
            { date: '2025-09-20', sessions: 29 },
            { date: '2025-09-21', sessions: 12 }
          ],
          responseTimeStats: [
            { hour: '00:00', avgTime: 52 },
            { hour: '04:00', avgTime: 48 },
            { hour: '08:00', avgTime: 35 },
            { hour: '12:00', avgTime: 41 },
            { hour: '16:00', avgTime: 38 },
            { hour: '20:00', avgTime: 44 }
          ],
          satisfactionBreakdown: [
            { name: 'Excellent', value: 45 },
            { name: 'Good', value: 30 },
            { name: 'Average', value: 15 },
            { name: 'Poor', value: 7 },
            { name: 'Very Poor', value: 3 }
          ],
          agentPerformance: [
            { name: 'Sarah K.', chatsHandled: 24, avgResponse: 38, satisfaction: 4.6 },
            { name: 'Mike R.', chatsHandled: 19, avgResponse: 42, satisfaction: 4.3 },
            { name: 'Lisa M.', chatsHandled: 16, avgResponse: 35, satisfaction: 4.8 },
            { name: 'AI Bot', chatsHandled: 68, avgResponse: 12, satisfaction: 3.9 }
          ]
        }
        break

      case 'user_stats':
        // Get user statistics
        const { data: userStats } = await supabase
          .from('profiles')
          .select('id, created_at, role')
          .order('created_at', { ascending: false })

        const totalUsers = userStats?.length || 0
        const recentUsers = userStats?.filter(u => {
          const createdAt = new Date(u.created_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return createdAt > weekAgo
        }).length || 0

        const roleDistribution = userStats?.reduce((acc, user) => {
          acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        data = { totalUsers, recentUsers, roleDistribution }
        break

      case 'activity_stats':
        // Get activity statistics
        const { data: chatSessions } = await supabase
          .from('chat_sessions')
          .select('created_at, status')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const { data: applications } = await supabase
          .from('applications')
          .select('created_at, status')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const { data: votes } = await supabase
          .from('community_votes')
          .select('created_at, is_active')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const activeChats = chatSessions?.filter(s => s.status === 'active').length || 0
        const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0
        const activeVotes = votes?.filter(v => v.is_active).length || 0

        data = { activeChats, pendingApplications, activeVotes, totalSessions: chatSessions?.length || 0 }
        break

      case 'content_stats':
        // Get content statistics
        const { data: characters } = await supabase
          .from('character_profiles')
          .select('id, is_active')
          .eq('is_active', true)

        const { data: events } = await supabase
          .from('rp_events')
          .select('id, status')

        const { data: achievements } = await supabase
          .from('achievements')
          .select('id, is_active')
          .eq('is_active', true)

        const activeCharacters = characters?.length || 0
        const upcomingEvents = events?.filter(e => e.status === 'scheduled').length || 0
        const totalAchievements = achievements?.length || 0

        data = { activeCharacters, upcomingEvents, totalAchievements }
        break

      case 'server_stats':
        // Get server statistics (from existing tables)
        const { data: serverStats } = await supabase
          .from('server_stats')
          .select('*')
          .order('last_updated', { ascending: false })
          .limit(1)

        const { data: individualStats } = await supabase
          .from('individual_server_stats')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(10)

        data = { 
          current: serverStats?.[0] || null,
          history: individualStats || []
        }
        break

      default:
        throw new Error('Invalid metric requested')
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in analytics data:', error)
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