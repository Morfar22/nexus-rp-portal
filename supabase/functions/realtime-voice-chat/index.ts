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

  const { socket, response } = Deno.upgradeWebSocket(req, {
    protocol: "",
  });
  
  let openAISocket: WebSocket | null = null;
  let sessionCreated = false;

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    socket.send(JSON.stringify({
      type: 'error',
      error: 'Server configuration error - API key not found'
    }));
    socket.close(1000, 'Server configuration error');
    return response;
  }

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    
    // Connect to OpenAI Realtime API
    try {
      console.log('Creating OpenAI WebSocket connection...');
      
      // Use the correct OpenAI Realtime WebSocket URL 
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      
      // For Deno, we need to create the WebSocket without custom headers 
      // and handle authentication through the subprotocol or connection upgrade
      openAISocket = new WebSocket(wsUrl, [`Bearer.${OPENAI_API_KEY}`, 'realtime-v1']);

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
            error: 'Failed to parse OpenAI response'
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
      console.error('Error creating OpenAI WebSocket connection:', error);
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