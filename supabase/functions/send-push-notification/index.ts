import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, data }: PushNotificationRequest = await req.json();
    
    console.log('Sending push notification:', { userId, title, body });

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      throw subscriptionError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the push payload
    const payload = JSON.stringify({
      title,
      body,
      data: data || {}
    });

    // Send push notifications to all user's devices
    const promises = subscriptions.map(async (sub) => {
      try {
        const subscription = sub.subscription;
        
        // Use Web Push API to send notification
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: subscription.keys?.p256dh, // This would need proper Web Push implementation
            notification: {
              title,
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'chat-notification',
              renotify: true,
              requireInteraction: true
            },
            data: data || {}
          })
        });

        if (!response.ok) {
          console.error('Failed to send push notification:', response.status);
        }
        
        return response.ok;
      } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;

    console.log(`Push notifications sent: ${successful}/${subscriptions.length}`);

    return new Response(
      JSON.stringify({ 
        message: `Push notifications sent to ${successful}/${subscriptions.length} devices`,
        successful,
        total: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});