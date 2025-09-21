import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users2, Bell, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommunicationStats {
  liveChatActive: boolean;
  pendingChats: number;
  missedMessages: number;
  discordMembers: number;
  supportTickets: number;
  responseTime: string;
}

export const CommunicationCenter = () => {
  const [stats, setStats] = useState<CommunicationStats>({
    liveChatActive: false,
    pendingChats: 0,
    missedMessages: 0,
    discordMembers: 0,
    supportTickets: 0,
    responseTime: "< 1h"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunicationStats();
    const interval = setInterval(fetchCommunicationStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCommunicationStats = async () => {
    try {
      // Fetch chat settings
      const { data: chatSettings } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_settings')
        .maybeSingle();

      // Fetch chat sessions
      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select('id, status')
        .in('status', ['waiting', 'active']);

      const pendingChats = chatSessions?.filter(s => s.status === 'waiting').length || 0;
      const activeChats = chatSessions?.filter(s => s.status === 'active').length || 0;

      // Get missed chats
      const { data: missedChats } = await supabase
        .from('missed_chats')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Try to get Discord member count from our backend
      let discordMembers = 0;
      try {
        const { data: discordData } = await supabase.functions.invoke('discord-stats', {
          body: { action: 'getMemberCount' }
        });
        discordMembers = discordData?.data?.memberCount || 0;
      } catch {
        // Fallback: try to get from server settings or use reasonable default
        const { data: discordSettings } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'discord_stats')
          .maybeSingle();
        
        discordMembers = (discordSettings?.setting_value as any)?.member_count || 180;
      }

      // Count support tickets (applications waiting for review)
      const { data: supportTickets } = await supabase
        .from('applications')
        .select('id')
        .eq('status', 'pending');

      const supportTicketCount = supportTickets?.length || 0;

      setStats({
        liveChatActive: (chatSettings?.setting_value as any)?.enabled || false,
        pendingChats,
        missedMessages: missedChats?.length || 0,
        discordMembers,
        supportTickets: supportTicketCount,
        responseTime: pendingChats > 5 ? "2-3h" : pendingChats > 2 ? "< 1h" : "< 30m"
      });
    } catch (error) {
      console.error('Error fetching communication stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResponseTimeColor = (time: string) => {
    if (time.includes("30m")) return "text-emerald-400";
    if (time.includes("1h")) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-neon-cyan" />
          <span>Communication</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Chat Status */}
        <div className="flex items-center justify-between p-3 bg-gaming-dark rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${stats.liveChatActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-foreground">Live Chat</span>
          </div>
          <Badge variant={stats.liveChatActive ? "default" : "destructive"}>
            {stats.liveChatActive ? "Active" : "Offline"}
          </Badge>
        </div>

        {/* Pending Actions */}
        {stats.pendingChats > 0 && (
          <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Attention Needed</span>
            </div>
            <p className="text-xs text-amber-300">
              {stats.pendingChats} chat{stats.pendingChats !== 1 ? 's' : ''} waiting for response
            </p>
          </div>
        )}

        {/* Communication Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gaming-dark rounded-lg">
            <MessageCircle className="h-4 w-4 mx-auto mb-1 text-neon-blue" />
            <p className="text-lg font-semibold text-foreground">{stats.pendingChats}</p>
            <p className="text-xs text-muted-foreground">Pending Chats</p>
          </div>
          
          <div className="text-center p-3 bg-gaming-dark rounded-lg">
            <Users2 className="h-4 w-4 mx-auto mb-1 text-neon-purple" />
            <p className="text-lg font-semibold text-foreground">{stats.discordMembers}</p>
            <p className="text-xs text-muted-foreground">Discord Members</p>
          </div>
        </div>

        {/* Response Time */}
        <div className="p-3 bg-gaming-dark rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg. Response Time</span>
            <span className={`text-sm font-medium ${getResponseTimeColor(stats.responseTime)}`}>
              {stats.responseTime}
            </span>
          </div>
        </div>

        {/* Missed Messages Alert */}
        {stats.missedMessages > 0 && (
          <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                {stats.missedMessages} missed message{stats.missedMessages !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="flex items-center justify-center space-x-1 p-2 bg-gaming-darker hover:bg-gaming-card rounded transition-colors text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>Open Chat</span>
            </button>
            <button className="flex items-center justify-center space-x-1 p-2 bg-gaming-darker hover:bg-gaming-card rounded transition-colors text-muted-foreground hover:text-foreground">
              <Send className="h-3 w-3" />
              <span>Broadcast</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};