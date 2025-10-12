import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import TypingIndicator from "./TypingIndicator";
import VoiceRecorder from "./VoiceRecorder";
import FileAttachment from "./FileAttachment";
import ChatMessage from "./ChatMessage";

interface Message {
  id: string;
  message: string;
  sender_type: 'visitor' | 'staff' | 'ai';
  created_at: string;
  sender_id?: string;
  attachments?: any[];
}

interface AIInteraction {
  id: string;
  ai_response: string;
  confidence_score: number;
  was_helpful?: boolean;
  escalated_to_human: boolean;
}

interface ChatSession {
  id: string;
  status: string;
  assigned_to?: string;
  user_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  created_at?: string;
  updated_at?: string;
  ended_at?: string;
}

const LiveChatWidget = () => {
  const { user } = useCustomAuth();
  
  // Load persisted state from localStorage
  const getPersistedState = () => {
    try {
      const saved = localStorage.getItem('liveChatState');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const persistedState = getPersistedState();

  const [isOpen, setIsOpen] = useState(persistedState.isOpen || false);
  const [isMinimized, setIsMinimized] = useState(persistedState.isMinimized || false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(persistedState.session || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [visitorName, setVisitorName] = useState(persistedState.visitorName || "");
  const [visitorEmail, setVisitorEmail] = useState(persistedState.visitorEmail || "");
  const [hasStartedChat, setHasStartedChat] = useState(persistedState.hasStartedChat || false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiInteractions, setAiInteractions] = useState<AIInteraction[]>([]);
  const [lastAiResponse, setLastAiResponse] = useState<AIInteraction | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist state to localStorage whenever critical state changes
  const saveStateToStorage = () => {
    try {
      const stateToSave = {
        isOpen,
        isMinimized,
        session,
        visitorName,
        visitorEmail,
        hasStartedChat
      };
      localStorage.setItem('liveChatState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving chat state:', error);
    }
  };

  // Save state whenever critical values change
  useEffect(() => {
    saveStateToStorage();
  }, [isOpen, isMinimized, session, visitorName, visitorEmail, hasStartedChat]);

  useEffect(() => {
    checkChatSettings();
    
    // If we have a persisted session, validate it's still active
    if (persistedState.session && persistedState.hasStartedChat) {
      validateAndRestoreSession(persistedState.session);
    }
  }, []);

  // Validate and restore a persisted session
  const validateAndRestoreSession = async (persistedSession: ChatSession) => {
    try {
      const { data: sessionData, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', persistedSession.id)
        .single();

      if (error) {
        console.error('Session validation error:', error);
        clearPersistedState();
        return;
      }

      // Check if session is still active or waiting (not ended)
      if (sessionData && sessionData.status !== 'ended') {
        console.log('Restored chat session:', sessionData.id);
        setSession(sessionData);
      } else {
        console.log('Session has ended, clearing persisted state');
        clearPersistedState();
      }
    } catch (error) {
      console.error('Error validating session:', error);
      clearPersistedState();
    }
  };

  // Clear persisted state when session is invalid
  const clearPersistedState = () => {
    try {
      localStorage.removeItem('liveChatState');
      setSession(null);
      setHasStartedChat(false);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session) {
      loadExistingMessages();
      subscribeToMessages();
      subscribeToSessionUpdates();
      subscribeToAIInteractions();
    }
  }, [session]);

  const checkChatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'chat_settings')
        .single();

      if (error) throw error;

      const settings = data?.setting_value as any;
      setChatEnabled(settings?.enabled || false);
      } catch (error) {
        // Silently handle missing chat settings - this is not critical
        console.debug('Chat settings not configured:', error);
      }
  };

  const loadExistingMessages = async () => {
    if (!session) return;

    console.log('LiveChatWidget: Loading existing messages for session:', session.id);

    try {
      // Load messages separately first
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Load file attachments separately
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('chat_file_attachments')
        .select('*')
        .eq('session_id', session.id);

      if (attachmentsError) throw attachmentsError;

      // Load AI interactions
      const { data: aiData, error: aiError } = await supabase
        .from('chat_ai_interactions')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (aiError) throw aiError;

      console.log('LiveChatWidget: Loaded existing messages:', messagesData?.length || 0);
      console.log('LiveChatWidget: Loaded AI interactions:', aiData?.length || 0);
      
      const allMessages: Message[] = [];
      
      // Merge messages and AI interactions chronologically
      let messageIndex = 0;
      let aiIndex = 0;

      while (messageIndex < (messagesData?.length || 0) || aiIndex < (aiData?.length || 0)) {
        const currentMessage = messagesData?.[messageIndex];
        const currentAI = aiData?.[aiIndex];

        const messageTime = currentMessage ? new Date(currentMessage.created_at).getTime() : Infinity;
        const aiTime = currentAI ? new Date(currentAI.created_at).getTime() : Infinity;

        if (messageTime <= aiTime) {
          if (currentMessage) {
            // Find attachments for this message
            const messageAttachments = attachmentsData?.filter(att => att.message_id === currentMessage.id) || [];
            
            allMessages.push({
              id: currentMessage.id,
              message: currentMessage.message,
              sender_type: currentMessage.sender_type as 'visitor' | 'staff' | 'ai',
              created_at: currentMessage.created_at,
              sender_id: currentMessage.sender_id,
              attachments: messageAttachments
            });
            messageIndex++;
          }
        } else {
          if (currentAI) {
            // Add AI response as a message
            allMessages.push({
              id: `ai_${currentAI.id}`,
              message: currentAI.ai_response,
              sender_type: 'ai',
              created_at: currentAI.created_at,
              attachments: []
            });
            aiIndex++;
          }
        }
      }

      setMessages(allMessages);
      setAiInteractions(aiData || []);
    } catch (error) {
      console.error('LiveChatWidget: Error loading existing messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!session) return;

    console.log('LiveChatWidget: Setting up message subscription for session:', session.id);

    const channel = supabase
      .channel(`chat_messages_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          console.log('LiveChatWidget: Received new message via real-time:', payload);
          const newMessage = payload.new as any;
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            console.log('LiveChatWidget: Adding message to state. Previous count:', prev.length);
            const message: Message = {
              id: newMessage.id,
              message: newMessage.message,
              sender_type: newMessage.sender_type as 'visitor' | 'staff' | 'ai',
              created_at: newMessage.created_at,
              sender_id: newMessage.sender_id,
              attachments: []
            };
            
            // If this is an AI message, track it for feedback
            if (newMessage.sender_type === 'ai' && newMessage.sender_id) {
              // Fetch the AI interaction for feedback purposes
              supabase
                .from('chat_ai_interactions')
                .select('*')
                .eq('id', newMessage.sender_id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setAiInteractions(prev => [...prev, data]);
                    setLastAiResponse(data);
                  }
                });
            }
            
            return [...prev, message];
          });
        }
      )
      .subscribe((status) => {
        console.log('LiveChatWidget: Subscription status:', status);
      });

    return () => {
      console.log('LiveChatWidget: Cleaning up message subscription');
      supabase.removeChannel(channel);
    };
  };

  const subscribeToAIInteractions = () => {
    // No longer needed - AI responses are now saved as regular chat messages
    // This prevents duplicate AI messages from appearing
    return () => {};
  };

  const subscribeToSessionUpdates = () => {
    if (!session) return;

    const channel = supabase
      .channel(`chat_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const updatedSession = payload.new as ChatSession;
          setSession(updatedSession);
          
          if (updatedSession.status === 'active' && session.status === 'waiting') {
            toast({
              title: "Chat Connected",
              description: "A staff member has joined the chat",
            });
          }
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

  const startChat = async () => {
    if (!visitorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to start the chat",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get user's IP address (best effort)
      let userIP = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (ipError) {
        console.warn('Could not get IP address:', ipError);
      }

      // Check if user is banned by email or IP
      const banChecks = [];
      
      if (visitorEmail) {
        banChecks.push(
          supabase
            .from('chat_banned_users')
            .select('id, reason')
            .eq('visitor_email', visitorEmail)
            .limit(1)
        );
      }

      if (userIP) {
        banChecks.push(
          supabase
            .from('chat_banned_users')
            .select('id, reason')
            .eq('ip_address', userIP)
            .limit(1)
        );
      }

      if (banChecks.length > 0) {
        const banResults = await Promise.all(banChecks);
        
        for (const result of banResults) {
          if (result.error) throw result.error;
          
          if (result.data && result.data.length > 0) {
            toast({
              title: "Access Denied",
              description: "You are currently banned from using live chat",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // Attach authenticated user if available
      const userId = user?.id ?? null;

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          visitor_name: visitorName,
          visitor_email: visitorEmail || null,
          status: 'waiting',
          user_id: userId
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
      setHasStartedChat(true);

      // Log chat start to Discord
      try {
        await supabase.functions.invoke('discord-chat-logger', {
          body: {
            type: 'chat_started',
            sessionId: sessionData.id,
            visitorName: visitorName,
            visitorEmail: visitorEmail
          }
        });
      } catch (discordError) {
        console.warn('Failed to log chat start to Discord:', discordError);
      }

      toast({
        title: "Chat Started",
        description: "Waiting for a staff member to join...",
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!session || !text.trim()) return;

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator(false);
    }, 3000);
  };

  const updateTypingIndicator = async (typing: boolean) => {
    if (!session) return;

    try {
      if (typing) {
        await supabase
          .from('chat_typing_indicators')
          .upsert({
            session_id: session.id,
            user_id: user?.id,
            user_type: 'visitor',
            is_typing: true,
            last_activity: new Date().toISOString()
          }, {
            onConflict: 'session_id,user_id,user_type'
          });
      } else {
        let deleteQuery = supabase
          .from('chat_typing_indicators')
          .delete()
          .eq('session_id', session.id)
          .eq('user_type', 'visitor');
        
        if (user?.id) {
          deleteQuery = deleteQuery.eq('user_id', user.id);
        } else {
          deleteQuery = deleteQuery.is('user_id', null);
        }
        
        await deleteQuery;
      }
    } catch (error) {
      console.error('Error updating typing indicator:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    const messageText = newMessage.trim();
    console.log('LiveChatWidget: Sending message:', {
      session_id: session.id,
      message: messageText,
      sender_type: 'visitor'
    });

    // Clear typing indicator
    setIsTyping(false);
    updateTypingIndicator(false);
    
    // Clear message input immediately for better UX
    setNewMessage("");

    try {
      // Check if this should trigger AI assistance (no human staff assigned yet)
      if (!session.assigned_to && session.status === 'waiting') {
        console.log('LiveChatWidget: Triggering AI assistance');
        
        // First, try AI assistance
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke('chat-ai-assistant', {
            body: {
              sessionId: session.id,
              message: messageText,
              userType: 'visitor'
            }
          });

          if (!aiError && aiData && !aiData.shouldEscalate && aiData.confidence > 0.3) {
            // AI can handle this, but still save the user message
            await supabase
              .from('chat_messages')
              .insert({
                session_id: session.id,
                message: messageText,
                sender_type: 'visitor'
              });

            return; // AI response will be added via real-time subscription
          }
        } catch (aiError) {
          console.warn('AI assistance failed, proceeding with normal flow:', aiError);
        }
      }

      // Send regular message
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: session.id,
          message: messageText,
          sender_type: 'visitor'
        })
        .select();

      if (error) {
        console.error('LiveChatWidget: Insert error:', error);
        throw error;
      }

      console.log('LiveChatWidget: Message sent successfully:', data);
    } catch (error) {
      console.error('LiveChatWidget: Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      // Restore message on error
      setNewMessage(messageText);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setNewMessage(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleFileUploaded = (attachment: any) => {
    console.log('File uploaded:', attachment);
    // The attachment will be displayed when the message is received via real-time
  };

  const rateAIResponse = async (helpful: boolean) => {
    if (!lastAiResponse) return;

    try {
      await supabase
        .from('chat_ai_interactions')
        .update({ was_helpful: helpful })
        .eq('id', lastAiResponse.id);

      setLastAiResponse(null);
      
      toast({
        title: helpful ? "Thank you!" : "Feedback received",
        description: helpful 
          ? "Glad the AI assistant was helpful!" 
          : "We'll work on improving our AI responses",
      });
    } catch (error) {
      console.error('Error rating AI response:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = async () => {
    if (!session) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id);

      // Clear persisted state when ending chat
      clearPersistedState();
      
      toast({
        title: "Chat Ended",
        description: "Thank you for using our support chat",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  if (!chatEnabled) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Modern Chat Widget */}
      {isOpen && (
        <Card className={`fixed bottom-6 right-6 bg-gradient-card border border-primary/20 shadow-gaming backdrop-blur-sm z-50 transition-all duration-500 ease-out ${
          isMinimized ? 'h-20 w-96' : 'h-[32rem] w-96'
        } hover:shadow-glow-primary`}>
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gaming-card animate-pulse"></div>
              </div>
              <div>
                <span className="font-bold text-foreground text-lg">Live Support</span>
                {session && (
                  <Badge 
                    variant={session.status === 'active' ? 'default' : 'secondary'} 
                    className="ml-2 text-xs"
                  >
                    {session.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                variant="ghost"
                size="sm"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col h-[28rem]">
              {!hasStartedChat ? (
                /* Enhanced Start Chat Form */
                <div className="p-6 space-y-6">
                  <div className="text-center mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Start Live Chat</h3>
                    <p className="text-sm text-muted-foreground">Get instant support from our team</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Name *</label>
                      <Input
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Your name"
                        className="bg-surface border-border focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email (optional)</label>
                      <Input
                        type="email"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-surface border-border focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={startChat}
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold rounded-lg shadow-glow-soft transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      'Start Chat'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Enhanced Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-gradient-to-b from-surface/50 to-background/50">
                     {messages.length === 0 && session?.status === 'waiting' && (
                       <div className="text-center text-muted-foreground text-sm py-8">
                         <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                           <Bot className="h-8 w-8 text-primary-foreground" />
                         </div>
                         <div className="space-y-2">
                           <p className="font-semibold text-lg text-foreground">🧠 AI Learning Assistant</p>
                           <p className="text-sm">Jeg lærer konstant fra hver interaction og bliver smartere! Spørg mig om alt!</p>
                           
                           {/* Learning Status Indicator */}
                           <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-3 mx-6 mt-4">
                             <div className="flex items-center justify-center space-x-2 mb-2">
                               <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                               <span className="text-xs font-medium text-foreground">Learning Status</span>
                             </div>
                             <div className="text-xs text-muted-foreground space-y-1">
                               <div className="flex justify-between">
                                 <span>🎯 Accuracy Rate:</span>
                                 <span className="text-green-600 font-medium">Improving daily</span>
                               </div>
                               <div className="flex justify-between">
                                 <span>📚 Knowledge Base:</span>
                                 <span className="text-blue-600 font-medium">Growing</span>
                               </div>
                               <div className="text-center text-xs text-muted-foreground mt-2">
                                 Din feedback hjælper mig blive bedre! 🚀
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex flex-wrap justify-center gap-2 mt-4">
                             <Badge variant="outline" className="text-xs">Server IP</Badge>
                             <Badge variant="outline" className="text-xs">Ansøgninger</Badge>
                             <Badge variant="outline" className="text-xs">Discord</Badge>
                             <Badge variant="outline" className="text-xs">Regler</Badge>
                             <Badge variant="outline" className="text-xs">Tech Support</Badge>
                           </div>
                         </div>
                       </div>
                     )}
                    
                    {messages.map((message, index) => {
                      const isOwn = message.sender_type === 'visitor';
                      const isAI = message.sender_type === 'ai';
                      
                      return (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          isOwn={isOwn}
                          senderName={isAI ? undefined : (isOwn ? visitorName : 'Staff')}
                          showAvatar={!isOwn}
                        />
                      );
                    })}
                    
                     {/* Enhanced AI Response Rating with Learning Indicators */}
                     {lastAiResponse && (
                       <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 mx-4 rounded-lg p-4 border border-border/30">
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                             <span className="text-sm font-medium text-foreground">🧠 AI Learning Assistant</span>
                           </div>
                           <div className="flex items-center space-x-1">
                             <div className="text-xs text-muted-foreground">
                               Confidence: {Math.round(lastAiResponse.confidence_score * 100)}%
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                           <div className="flex flex-col space-y-1">
                             <span className="text-sm text-muted-foreground">Var dette svar nyttigt?</span>
                             <span className="text-xs text-muted-foreground">
                               Din feedback hjælper mig med at lære og blive bedre! 🎯
                             </span>
                           </div>
                           <div className="flex space-x-2">
                             <Button
                               onClick={() => rateAIResponse(true)}
                               variant="outline"
                               size="sm"
                               className="h-9 px-3 border-green-500/50 text-green-600 hover:bg-green-500/10 hover:text-green-500 transition-colors group"
                             >
                               <ThumbsUp className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                               <span className="text-xs font-medium">Hjælpsom</span>
                             </Button>
                             <Button
                               onClick={() => rateAIResponse(false)}
                               variant="outline"
                               size="sm"
                               className="h-9 px-3 border-orange-500/50 text-orange-600 hover:bg-orange-500/10 hover:text-orange-500 transition-colors group"
                             >
                               <ThumbsDown className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                               <span className="text-xs font-medium">Kan bedre</span>
                             </Button>
                           </div>
                         </div>
                         
                         {lastAiResponse.confidence_score > 0.8 && (
                           <div className="mt-3 flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                             <span>Høj sikkerhed - jeg er meget sikker på dette svar!</span>
                           </div>
                         )}
                         
                         {lastAiResponse.confidence_score < 0.6 && (
                           <div className="mt-3 flex items-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
                             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                             <span>Lav sikkerhed - måske vil staff kunne hjælpe bedre?</span>
                           </div>
                         )}
                       </div>
                     )}
                    
                     {/* Typing Indicator */}
                     <TypingIndicator 
                       sessionId={session.id} 
                       currentUserType="visitor"
                       currentUserId={user?.id}
                     />
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Enhanced Message Input */}
                  <div className="p-4 border-t border-border/50 bg-surface/30 backdrop-blur-sm">
                    <div className="flex items-end space-x-3 mb-3">
                      <div className="flex-1 relative">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => handleTyping(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="flex-1 min-h-[44px] max-h-[88px] bg-background border-border focus:border-primary resize-none pr-20 rounded-lg transition-colors"
                          rows={1}
                        />
                        
                        <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                          <VoiceRecorder 
                            onTranscription={handleVoiceTranscription}
                            isDisabled={!session}
                          />
                          
                           <FileAttachment
                             sessionId={session?.id || ''}
                             senderId={user?.id}
                             senderType="visitor"
                             onFileUploaded={handleFileUploaded}
                             isDisabled={!session}
                           />
                        </div>
                      </div>
                      
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !session}
                        size="sm"
                        className="h-11 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm transition-all duration-200"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {session && (
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {session.status === 'waiting' && (
                            <span className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span>AI Assistant Active</span>
                            </span>
                          )}
                          {session.status === 'active' && (
                            <span className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Staff Member Online</span>
                            </span>
                          )}
                        </div>
                        
                        <Button
                          onClick={endChat}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 text-xs"
                        >
                          End Chat
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default LiveChatWidget;