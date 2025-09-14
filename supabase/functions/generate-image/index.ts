import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  prompt: string;
  size?: string;
  style?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size = "1024x1024", style = "realistic" }: ImageRequest = await req.json();

    console.log(`Generating image with prompt: ${prompt}, size: ${size}, style: ${style}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create enhanced prompt based on style
    const styleEnhancements = {
      realistic: 'photorealistic, high detail, professional quality, ultra high resolution',
      artistic: 'artistic painting style, creative interpretation, painterly, expressive',
      cartoon: 'cartoon illustration, animated style, colorful, fun and vibrant',
      cyberpunk: 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere, high-tech'
    };

    const enhancedPrompt = `${prompt}, ${styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.realistic}`;

    // Call OpenAI DALL-E API with correct parameters
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size === '512x512' ? '1024x1024' : size, // DALL-E 3 doesn't support 512x512
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No image data received from OpenAI');
    }

    const imageUrl = data.data[0].url;
    console.log('Image generated successfully');

    return new Response(JSON.stringify({ 
      image: imageUrl,
      prompt: enhancedPrompt,
      size,
      style
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in generate-image function:", error);
    
    // Return a more helpful error response
    return new Response(JSON.stringify({ 
      error: "Failed to generate image", 
      details: error.message,
      fallback: "Image generation temporarily unavailable - please try again later"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);