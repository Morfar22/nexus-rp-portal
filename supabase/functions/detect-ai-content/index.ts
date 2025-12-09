import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced AI detection using Lovable AI Gateway
async function detectAIContentWithAI(text: string): Promise<{ isAI: boolean; score: number; reasons: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, falling back to heuristics");
    return detectAIContentHeuristics(text);
  }

  if (!text || text.length < 50) {
    return { isAI: false, score: 0, reasons: ["Teksten er for kort til analyse"] };
  }

  try {
    console.log("Calling Lovable AI Gateway for AI detection...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du er en ekspert i at analysere tekst for at afgøre om den er skrevet af AI (som ChatGPT, Claude, etc.) eller af et menneske.

Analyser den givne tekst og vurder sandsynligheden for at den er AI-genereret baseret på:
1. Sprogmønstre og sætningsstruktur
2. Brug af generiske fraser og buzzwords
3. Mangel på personlige detaljer eller følelser
4. Overordentlig perfekt grammatik og tegnsætning
5. Repetitive mønstre og strukturer
6. Mangel på uformelt sprog eller slang
7. Overdrevent forklarende stil

Svar KUN med et JSON-objekt i dette format:
{
  "isAI": true/false,
  "score": 0-100,
  "reasons": ["grund 1", "grund 2", "grund 3"]
}

Score: 0-30 = sandsynligvis menneske, 31-60 = usikkert, 61-100 = sandsynligvis AI`
          },
          {
            role: "user",
            content: `Analyser denne tekst for AI-genereret indhold:\n\n${text.substring(0, 3000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      return detectAIContentHeuristics(text);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI Gateway response:", content);

    // Parse JSON response
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = content;
      if (content.includes("```")) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) jsonStr = match[1];
      }
      
      const result = JSON.parse(jsonStr.trim());
      return {
        isAI: result.isAI === true,
        score: Math.min(100, Math.max(0, Number(result.score) || 0)),
        reasons: Array.isArray(result.reasons) ? result.reasons : ["Analyse gennemført"]
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return detectAIContentHeuristics(text);
    }
  } catch (error) {
    console.error("AI Gateway request failed:", error);
    return detectAIContentHeuristics(text);
  }
}

// Fallback heuristic detection
function detectAIContentHeuristics(text: string): { isAI: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (!text || text.length < 50) {
    return { isAI: false, score: 0, reasons: ["Teksten er for kort til analyse"] };
  }

  const lowerText = text.toLowerCase();

  // Danish and English AI phrases
  const aiPhrases = [
    // Danish
    "det er vigtigt at", "for det første", "for det andet", "derudover",
    "endvidere", "ydermere", "i den forbindelse", "overordnet set",
    "det skal nævnes", "man kan argumentere for", "grundlæggende",
    "med andre ord", "sammenfattende", "professionel", "effektiv",
    // English
    "as an ai", "i'm an ai", "i'd be happy to", "certainly!", "absolutely!",
    "great question", "let me explain", "it's important to note", "in conclusion",
    "furthermore", "moreover", "additionally", "comprehensive", "delve into",
    "leverage", "utilize", "facilitate", "optimal", "seamlessly", "robust"
  ];

  let phraseMatches = 0;
  for (const phrase of aiPhrases) {
    if (lowerText.includes(phrase)) {
      phraseMatches++;
      if (phraseMatches <= 3) {
        reasons.push(`Indeholder AI-typisk frase: "${phrase}"`);
      }
    }
  }
  score += Math.min(phraseMatches * 10, 40);

  // Check for overly formal or structured writing
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
  
  if (avgSentenceLength > 25) {
    score += 15;
    reasons.push("Meget lange gennemsnitlige sætninger (typisk for AI)");
  }

  // Check for lack of personal pronouns
  const personalPronouns = (text.match(/\b(jeg|min|mig|mit|mine|i|my|me|myself)\b/gi) || []).length;
  const wordCount = text.split(/\s+/).length;
  const pronounRatio = personalPronouns / wordCount;
  
  if (pronounRatio < 0.01 && wordCount > 100) {
    score += 15;
    reasons.push("Meget lav brug af personlige stedord");
  }

  // Check for bullet points or numbered lists
  const hasBulletPoints = /^\s*[-•*]\s+/m.test(text) || /^\s*\d+[.)]\s+/m.test(text);
  if (hasBulletPoints) {
    score += 10;
    reasons.push("Indeholder strukturerede punktopstillinger");
  }

  score = Math.min(score, 100);

  return {
    isAI: score >= 40,
    score,
    reasons: reasons.length > 0 ? reasons : ["Ingen væsentlige AI-indikatorer fundet"]
  };
}

serve(async (req) => {
  console.log("=== DETECT-AI-CONTENT FUNCTION START ===");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    const sessionToken = authHeader.replace("Bearer ", "");
    console.log("Session token (first 10 chars):", sessionToken.substring(0, 10) + "...");
    
    const { data: session, error: sessionError } = await supabase
      .from("custom_sessions")
      .select("user_id, expires_at")
      .eq("session_token", sessionToken)
      .single();

    console.log("Session lookup result:", { found: !!session, error: sessionError?.message });

    if (sessionError || !session) {
      console.log("ERROR: Session not found");
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      console.log("ERROR: Session expired");
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is staff
    const { data: user, error: userError } = await supabase
      .from("custom_users")
      .select("id, role")
      .eq("id", session.user_id)
      .single();

    console.log("User lookup result:", { found: !!user, role: user?.role, error: userError?.message });

    if (userError || !user || !["admin", "staff", "moderator"].includes(user.role)) {
      console.log("ERROR: Not staff");
      return new Response(JSON.stringify({ error: "Unauthorized - Staff access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { applicationId } = body;
    console.log("Application ID:", applicationId);

    if (!applicationId) {
      console.log("ERROR: No application ID");
      return new Response(JSON.stringify({ error: "Application ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, form_data")
      .eq("id", applicationId)
      .single();

    console.log("Application lookup:", { found: !!application, error: appError?.message });

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Combine all text from form_data for analysis
    let combinedText = "";
    if (application.form_data && typeof application.form_data === "object") {
      for (const [key, value] of Object.entries(application.form_data)) {
        if (typeof value === "string" && value.length > 20) {
          combinedText += value + "\n\n";
        }
      }
    }

    console.log("Combined text length:", combinedText.length);

    // Perform AI detection with AI model
    const result = await detectAIContentWithAI(combinedText);
    console.log("AI Detection result:", result);

    // Update application with AI detection results
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        ai_detected: result.isAI,
        ai_detection_score: result.score,
        ai_checked_at: new Date().toISOString(),
        ai_checked_by: user.id,
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update application" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("=== DETECT-AI-CONTENT SUCCESS ===");
    return new Response(
      JSON.stringify({
        success: true,
        isAI: result.isAI,
        score: result.score,
        reasons: result.reasons,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in detect-ai-content:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
