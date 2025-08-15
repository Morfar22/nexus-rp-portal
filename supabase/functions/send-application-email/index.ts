import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log('OPTIONS request received');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    console.log('Email function called - basic test');
    
    // Check API key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log('API key exists:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('RESEND_API_KEY not found');
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    console.log('Request body received:', Object.keys(body));

    // Don't try to send email yet, just return success
    console.log('Function completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Function works - email sending disabled for testing",
        apiKeyExists: !!apiKey,
        requestData: Object.keys(body)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Email function error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        details: error.toString(),
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);