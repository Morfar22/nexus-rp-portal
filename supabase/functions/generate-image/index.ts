import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  try {
    const { prompt, size = '1024x1024', style = 'realistic' } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhance prompt based on style
    const styleEnhancement = {
      realistic: 'photorealistic, high detail, professional quality',
      artistic: 'artistic style, painterly, creative illustration',
      cartoon: 'cartoon style, animated, colorful, fun',
      cyberpunk: 'cyberpunk aesthetic, neon colors, futuristic, dark atmosphere'
    };

    const enhancedPrompt = `${prompt}, ${styleEnhancement[style] || styleEnhancement.realistic}, ultra high resolution`;

    console.log('Generating image with prompt:', enhancedPrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: 'high',
        output_format: 'png',
        style: style === 'realistic' ? 'natural' : 'vivid'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Image generated successfully');
    
    // The new API returns base64 data directly
    const imageBase64 = data.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return new Response(JSON.stringify({ 
      image: imageUrl,
      prompt: enhancedPrompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate image', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});