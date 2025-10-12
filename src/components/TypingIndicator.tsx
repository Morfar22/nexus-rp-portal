import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingIndicatorProps {
  sessionId: string;
  currentUserType: 'visitor' | 'staff';
  currentUserId?: string;
}

export default function TypingIndicator({ sessionId, currentUserType, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to typing indicators for this session
    const channel = supabase
      .channel(`typing_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing_indicators',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Typing indicator update:', payload);
          fetchTypingIndicators();
        }
      )
      .subscribe();

    fetchTypingIndicators();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const fetchTypingIndicators = async () => {
    try {
      // Get currently typing users (excluding current user)
      let query = supabase
        .from('chat_typing_indicators')
        .select('user_type, user_id')
        .eq('session_id', sessionId)
        .eq('is_typing', true)
        .gte('last_activity', new Date(Date.now() - 10000).toISOString()) // Only last 10 seconds
        .neq('user_type', currentUserType);

      // Only filter by user_id if we have a valid currentUserId
      if (currentUserId && currentUserId.trim() !== '') {
        query = query.neq('user_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typing = data?.map(indicator => {
        if (indicator.user_type === 'staff') return 'Staff member';
        return 'Visitor';
      }) || [];

      setTypingUsers(typing);
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
    }
  };

  // Auto cleanup old typing indicators
  useEffect(() => {
    const cleanup = setInterval(() => {
      supabase
        .from('chat_typing_indicators')
        .delete()
        .eq('session_id', sessionId)
        .lt('last_activity', new Date(Date.now() - 10000).toISOString())
        .then(({ error }) => {
          if (error) console.error('Error cleaning up typing indicators:', error);
        });
    }, 5000);

    return () => clearInterval(cleanup);
  }, [sessionId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-neon-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {typingUsers.length === 1 
          ? `${typingUsers[0]} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
}