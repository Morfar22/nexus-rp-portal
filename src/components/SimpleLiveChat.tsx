import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User, Clock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface Message {
  id: string;
  message: string;
  sender_type: 'visitor' | 'staff' | 'ai';
  sender_name?: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  status: string;
  visitor_name?: string;
  visitor_email?: string;
}

const SimpleLiveChat = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Auto-fill user data when chat opens
  useEffect(() => {
    if (isOpen && user) {
      setVisitorName(user.username || user.email || "");
      setVisitorEmail(user.email || "");
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && session) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [session, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'visitor' | 'staff' | 'ai'
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!session) return;

    const channel = supabase
      .channel(`chat_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            ...newMsg,
            sender_type: newMsg.sender_type as 'visitor' | 'staff' | 'ai'
          }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'chat_ai_interactions',
          filter: `session_id=eq.${session.id}`
        },
        async (payload) => {
          console.log('AI interaction received:', payload.new);
          // Add AI response as a message
          const aiMessage: Message = {
            id: `ai_${payload.new.id}`,
            message: payload.new.ai_response,
            sender_type: 'ai',
            sender_name: 'AI Support',
            created_at: payload.new.created_at
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startChat = async () => {
    const name = user ? (user.username || user.email || "") : visitorName;
    const email = user ? user.email || "" : visitorEmail;
    
    if (!name.trim()) {
      toast({
        title: "Fejl",
        description: "Kunne ikke finde dit navn. Prøv at logge ind igen.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        status: 'waiting',
        user_id: user?.id || null,
        visitor_name: name,
        visitor_email: email || null
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      setHasStartedChat(true);
      
      // Send automatic welcome message
      await sendWelcomeMessage(data.id);
      
      toast({
        title: "Chat Startet",
        description: "Du er nu i kø til support. Vores AI assistent kan hjælpe dig mens du venter."
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke starte chat. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeMessage = async (sessionId: string) => {
    const name = user ? (user.username || user.email || "") : visitorName;
    const welcomeMessage = {
      session_id: sessionId,
      message: `Hej ${name}! 👋 Velkommen til Adventure RP support. Vores AI assistent er her for at hjælpe dig med spørgsmål om serveren. Hvis du har brug for menneskeligt personale, vil de blive kontaktet automatisk.`,
      sender_type: 'ai' as const,
      sender_name: 'AI Support'
    };

    try {
      await supabase.from('chat_messages').insert(welcomeMessage);
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    setIsLoading(true);
    try {
      // Send user message
      const name = user ? (user.username || user.email || "") : visitorName;
      const messageData = {
        session_id: session.id,
        message: newMessage,
        sender_type: user ? 'visitor' : 'visitor' as const,
        sender_id: user?.id || null,
        sender_name: name
      };

      await supabase.from('chat_messages').insert(messageData);

      // Trigger AI response
      await supabase.functions.invoke('chat-ai-assistant', {
        body: {
          message: newMessage,
          sessionId: session.id,
          userType: 'visitor'
        }
      });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende besked",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endChat = () => {
    if (session) {
      supabase.from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id);
    }
    
    setIsOpen(false);
    setSession(null);
    setMessages([]);
    setHasStartedChat(false);
    setVisitorName("");
    setVisitorEmail("");
    
    toast({
      title: "Chat Afsluttet",
      description: "Tak fordi du brugte Adventure RP support"
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-96">
          <Card className="h-full flex flex-col bg-gaming-card border-gaming-border">
            {/* Header */}
            <div className="p-4 border-b border-gaming-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">Adventure RP Support</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col">
              {!hasStartedChat ? (
                /* Start Chat Form */
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Start Live Support</h3>
                    <p className="text-sm text-muted-foreground">Få hjælp fra vores AI assistent eller staff team</p>
                  </div>
                  
                  <div className="space-y-3">
                    {user && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Logget ind som:</p>
                        <p className="font-medium">{user.username || user.email}</p>
                        {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                      </div>
                    )}
                    {!user && (
                      <>
                        <div>
                          <Input
                            placeholder="Dit navn *"
                            value={visitorName}
                            onChange={(e) => setVisitorName(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Din email (valgfrit)"
                            type="email"
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </>
                    )}
                    <Button 
                      onClick={startChat} 
                      disabled={isLoading || (!user && !visitorName.trim())}
                      className="w-full"
                    >
                      {isLoading ? 'Starter...' : 'Start Chat'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender_type === 'visitor' 
                            ? 'bg-primary text-primary-foreground'
                            : message.sender_type === 'ai'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gaming-dark text-foreground'
                        }`}>
                          <div className="flex items-center space-x-1 mb-1">
                            {message.sender_type === 'ai' && <Bot className="h-3 w-3" />}
                            {message.sender_type === 'visitor' && <User className="h-3 w-3" />}
                            <span className="text-xs opacity-70">
                              {message.sender_name || (message.sender_type === 'ai' ? 'AI' : 'Du')}
                            </span>
                            <Clock className="h-3 w-3 opacity-50" />
                            <span className="text-xs opacity-50">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gaming-border">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Skriv din besked..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={isLoading || !newMessage.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        AI Assistent Aktiv
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={endChat}
                        className="text-xs"
                      >
                        Afslut Chat
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default SimpleLiveChat;