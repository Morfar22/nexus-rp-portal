import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionCreated = false;

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    socket.close(1000, 'Server configuration error');
    return response;
  }

  socket.onopen = async () => {
    console.log('Client WebSocket connected');
    
    try {
      console.log('Getting ephemeral token from OpenAI...');
      
      // Get ephemeral token for authentication
      const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-10-01',
          voice: 'alloy'
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Failed to get ephemeral token:', tokenResponse.status, errorText);
        socket.send(JSON.stringify({
          type: 'error',
          error: `Failed to authenticate with OpenAI: ${tokenResponse.status}`,
          details: errorText
        }));
        socket.close(1000, 'Authentication failed');
        return;
      }

      const tokenData = await tokenResponse.json();
      console.log('Got ephemeral token response:', {
        hasClientSecret: !!tokenData.client_secret?.value,
        expiresAt: tokenData.expires_at,
        sessionId: tokenData.id
      });

      if (!tokenData.client_secret?.value) {
        console.error('No client secret in token response:', tokenData);
        socket.send(JSON.stringify({
          type: 'error',
          error: 'Failed to get authentication token from OpenAI',
        }));
        socket.close(1000, 'Authentication failed');
        return;
      }

      // Connect to OpenAI WebSocket using ephemeral token in URL
      const ephemeralToken = tokenData.client_secret.value;
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01&access_token=${ephemeralToken}`;
      
      console.log('Connecting to OpenAI with ephemeral token in URL...');
      openAISocket = new WebSocket(wsUrl);

      openAISocket.onopen = () => {
        console.log('Successfully connected to OpenAI Realtime API');
        socket.send(JSON.stringify({
          type: 'connection_established',
          message: 'Connected to OpenAI'
        }));
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('OpenAI message type:', data.type);

          // Handle session creation
          if (data.type === 'session.created') {
            console.log('Session created, sending default configuration');
            sessionCreated = true;
            
            // Send default session configuration
            const sessionConfig = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: `You are a helpful customer support assistant for a gaming community. You are professional, friendly, and efficient. 
                              Keep responses concise and helpful. If you cannot help with something, acknowledge it clearly 
                              and suggest alternatives or escalation to a human agent.`,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
                },
                temperature: 0.8,
                max_response_output_tokens: 'inf'
              }
            };
            
            openAISocket?.send(JSON.stringify(sessionConfig));
            
            // Also send to client
            socket.send(JSON.stringify(data));
          } else {
            // Forward all other messages to client
            socket.send(JSON.stringify(data));
          }
        } catch (error) {
          console.error('Error parsing OpenAI message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            error: 'Failed to parse OpenAI response',
            details: error.message
          }));
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        socket.send(JSON.stringify({
          type: 'error',
          error: 'OpenAI connection error',
          details: error.toString()
        }));
      };

      openAISocket.onclose = (event) => {
        console.log('OpenAI WebSocket closed. Code:', event.code, 'Reason:', event.reason);
        socket.send(JSON.stringify({
          type: 'connection_closed',
          code: event.code,
          reason: event.reason || 'OpenAI connection closed'
        }));
        socket.close(1000, 'OpenAI connection closed');
      };

    } catch (error) {
      console.error('Error setting up OpenAI connection:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Failed to connect to OpenAI',
        details: error.message
      }));
      socket.close(1000, 'Failed to connect to OpenAI');
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Client message type:', data.type);

      // Only forward messages after session is created
      if (sessionCreated && openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        console.log('Forwarding message to OpenAI:', data.type);
        openAISocket.send(JSON.stringify(data));
      } else if (!sessionCreated) {
        console.log('Session not yet created, cannot forward message');
        socket.send(JSON.stringify({
          type: 'error',
          error: 'Session not ready'
        }));
      } else {
        console.log('OpenAI socket not ready, state:', openAISocket?.readyState);
        socket.send(JSON.stringify({
          type: 'error',
          error: 'Connection not ready'
        }));
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format'
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('Client WebSocket closed:', event.code, event.reason);
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  return response;
});