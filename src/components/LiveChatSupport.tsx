import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, User, Clock, Send } from "lucide-react";

interface ChatSession {
  id: string;
  visitor_name: string;
  visitor_email?: string;
  status: string;
  created_at: string;
  assigned_to?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  sender_id?: string;
}

const LiveChatSupport = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    subscribeToSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedSession) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToSessions = () => {
    const channel = supabase
      .channel('chat_sessions_staff')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions'
        },
        () => {
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = () => {
    if (!selectedSession) return;

    const channel = supabase
      .channel(`messages_${selectedSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSession.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const assignToSelf = async (session: ChatSession) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'active',
          assigned_to: user.id
        })
        .eq('id', session.id);

      if (error) throw error;

      setSelectedSession({ ...session, status: 'active', assigned_to: user.id });
      
      toast({
        title: "Chat Assigned",
        description: `You are now handling the chat with ${session.visitor_name}`,
      });
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast({
        title: "Error",
        description: "Failed to assign chat",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          message: newMessage,
          sender_type: 'staff',
          sender_id: user.id
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const endChat = async () => {
    if (!selectedSession) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (error) throw error;

      setSelectedSession(null);
      setMessages([]);
      
      toast({
        title: "Chat Ended",
        description: "Chat session has been closed",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Sessions List */}
      <Card className="bg-gaming-darker border-gaming-border">
        <div className="p-4 border-b border-gaming-border">
          <h3 className="font-semibold text-foreground">Active Chats</h3>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active chats</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-neon-teal/20 border-neon-teal'
                      : 'bg-gaming-dark border-gaming-border hover:bg-gaming-dark/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-neon-teal" />
                      <span className="font-medium text-foreground">{session.visitor_name}</span>
                    </div>
                    <Badge variant={session.status === 'waiting' ? 'secondary' : 'default'}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(session.created_at)}</span>
                  </div>
                  {session.status === 'waiting' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignToSelf(session);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="mt-2 w-full bg-neon-teal hover:bg-neon-teal/80"
                    >
                      Take Chat
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        {selectedSession ? (
          <Card className="bg-gaming-darker border-gaming-border h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gaming-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedSession.visitor_name}</h3>
                {selectedSession.visitor_email && (
                  <p className="text-sm text-muted-foreground">{selectedSession.visitor_email}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={selectedSession.status === 'active' ? 'default' : 'secondary'}>
                  {selectedSession.status}
                </Badge>
                <Button
                  onClick={endChat}
                  variant="destructive"
                  size="sm"
                >
                  End Chat
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_type === 'staff'
                          ? 'bg-neon-teal text-white'
                          : 'bg-gaming-dark border border-gaming-border text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gaming-border">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 min-h-[60px] bg-gaming-dark border-gaming-border resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-neon-teal hover:bg-neon-teal/80"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gaming-darker border-gaming-border h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a chat to start responding</p>
              <p className="text-sm">Choose from the active chats on the left</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveChatSupport;