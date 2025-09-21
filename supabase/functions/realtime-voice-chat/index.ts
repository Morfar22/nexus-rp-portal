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

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    
    // Connect to OpenAI Realtime API
    try {
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openAISocket.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
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
                instructions: `You are a helpful customer support assistant. You are professional, friendly, and efficient. 
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
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        socket.send(JSON.stringify({
          type: 'error',
          error: 'OpenAI connection error'
        }));
      };

      openAISocket.onclose = (event) => {
        console.log('OpenAI WebSocket closed:', event.code, event.reason);
        socket.close(1000, 'OpenAI connection closed');
      };

    } catch (error) {
      console.error('Error connecting to OpenAI:', error);
      socket.close(1000, 'Failed to connect to OpenAI');
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Client message type:', data.type);

      // Only forward messages after session is created
      if (sessionCreated && openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(JSON.stringify(data));
      } else if (!sessionCreated) {
        console.log('Session not yet created, queuing message');
        // Could implement message queuing here if needed
      }
    } catch (error) {
      console.error('Error parsing client message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('Client WebSocket closed:', event.code, event.reason);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});