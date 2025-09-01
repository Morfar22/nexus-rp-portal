import { useState, useEffect, useCallback, useRef } from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  email: boolean;
  awayTimeout: number; // minutes
}

interface ChatNotification {
  sessionId: string;
  visitorName: string;
  message?: string;
  type: 'new_chat' | 'new_message' | 'chat_assigned' | 'missed_chat';
}

export const useSimpleNotifications = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    desktop: true,
    sound: true,
    email: true,
    awayTimeout: 5
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [isAway, setIsAway] = useState(false);
  
  const lastActivityRef = useRef(Date.now());
  const awayTimeoutRef = useRef<NodeJS.Timeout>();

  // Request notification permissions
  const requestPermissions = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support desktop notifications",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        toast({
          title: "Permission Denied",
          description: "Desktop notifications are disabled. Enable them in your browser settings.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive desktop notifications for new chats and messages"
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [toast]);

  // Activity tracking
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isAway) {
      setIsAway(false);
    }
    
    // Reset away timeout
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }
    
    awayTimeoutRef.current = setTimeout(() => {
      setIsAway(true);
    }, settings.awayTimeout * 60 * 1000);
  }, [isAway, settings.awayTimeout]);

  // Play notification sound
  const playNotificationSound = useCallback((type: 'message' | 'chat' | 'urgent' = 'message') => {
    if (!settings.sound) return;
    
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different types
      const frequencies = {
        message: 800,
        chat: 600,
        urgent: 400
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [settings.sound]);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: ChatNotification) => {
    if (!settings.desktop || !hasPermission) return;

    const title = getNotificationTitle(notification);
    const options: NotificationOptions = {
      body: getNotificationBody(notification),
      icon: '/favicon.ico',
      tag: `chat-${notification.sessionId}`,
      requireInteraction: true
    };

    const desktopNotification = new Notification(title, options);
    
    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      desktopNotification.close();
    }, 10000);
  }, [settings.desktop, hasPermission]);

  // Send email notification for missed chats
  const sendEmailNotification = useCallback(async (notification: ChatNotification) => {
    if (!settings.email || !user || notification.type !== 'missed_chat') return;

    try {
      const { error } = await supabase.functions.invoke('send-missed-chat-email', {
        body: {
          userId: user.id,
          sessionId: notification.sessionId,
          visitorName: notification.visitorName,
          message: notification.message
        }
      });
      
      if (error) {
        console.error('Error sending email notification:', error);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }, [settings.email, user]);

  // Main notification function
  const notify = useCallback(async (notification: ChatNotification) => {
    console.log('Sending notification:', notification);
    
    // Always show desktop notification for immediate attention
    showDesktopNotification(notification);
    
    // Play sound based on notification type
    const soundType = notification.type === 'missed_chat' ? 'urgent' : 
                     notification.type === 'new_chat' ? 'chat' : 'message';
    playNotificationSound(soundType);
    
    // Send email for missed chats
    if (notification.type === 'missed_chat') {
      await sendEmailNotification(notification);
    }
  }, [showDesktopNotification, playNotificationSound, sendEmailNotification]);

  // Helper functions for notification content
  const getNotificationTitle = (notification: ChatNotification): string => {
    switch (notification.type) {
      case 'new_chat':
        return `New Chat from ${notification.visitorName}`;
      case 'new_message':
        return `Message from ${notification.visitorName}`;
      case 'chat_assigned':
        return `Chat Assigned: ${notification.visitorName}`;
      case 'missed_chat':
        return `Missed Chat from ${notification.visitorName}`;
      default:
        return 'Chat Notification';
    }
  };

  const getNotificationBody = (notification: ChatNotification): string => {
    switch (notification.type) {
      case 'new_chat':
        return `${notification.visitorName} has started a new chat session`;
      case 'new_message':
        return notification.message || 'New message received';
      case 'chat_assigned':
        return `You have been assigned to handle ${notification.visitorName}'s chat`;
      case 'missed_chat':
        return `${notification.visitorName} waited but received no response`;
      default:
        return 'You have a new notification';
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (user) {
      requestPermissions();
      
      // Set up activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, updateActivity, { passive: true });
      });
      
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, updateActivity);
        });
        
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
        }
      };
    }
  }, [user, requestPermissions, updateActivity]);

  // Load settings from local storage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chat-notification-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  // Save settings to local storage
  useEffect(() => {
    localStorage.setItem('chat-notification-settings', JSON.stringify(settings));
  }, [settings]);

  return {
    settings,
    setSettings,
    hasPermission,
    isAway,
    requestPermissions,
    notify,
    playNotificationSound
  };
};