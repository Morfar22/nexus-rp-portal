import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple AI detection heuristics
function detectAIContent(text: string): { isAI: boolean; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (!text || text.length < 50) {
    return { isAI: false, score: 0, reasons: ["Text too short for analysis"] };
  }

  const lowerText = text.toLowerCase();

  // Check for common AI phrases
  const aiPhrases = [
    "as an ai", "i'm an ai", "as a language model", "i don't have personal",
    "i cannot provide", "i'm not able to", "as a helpful assistant",
    "i'd be happy to", "certainly!", "absolutely!", "great question",
    "let me explain", "it's important to note", "in conclusion",
    "furthermore", "moreover", "additionally", "in this context",
    "it is worth noting", "one could argue", "from my perspective",
    "based on my understanding", "to be more specific",
    "in summary", "to summarize", "in essence", "fundamentally",
    "comprehensive", "delve into", "navigate", "leverage",
    "utilize", "facilitate", "optimal", "seamlessly",
    "robust", "cutting-edge", "innovative", "groundbreaking"
  ];

  let phraseMatches = 0;
  for (const phrase of aiPhrases) {
    if (lowerText.includes(phrase)) {
      phraseMatches++;
      if (phraseMatches <= 3) {
        reasons.push(`Contains AI-typical phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(phraseMatches * 8, 30);

  // Check for overly formal or structured writing
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
  
  if (avgSentenceLength > 25) {
    score += 10;
    reasons.push("Very long average sentence length (common in AI text)");
  }

  // Check for repetitive sentence starters
  const starters = sentences.map(s => s.trim().split(' ').slice(0, 2).join(' ').toLowerCase());
  const starterCounts = starters.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const repetitiveStarters = Object.values(starterCounts).filter(count => count > 2).length;
  if (repetitiveStarters > 0) {
    score += repetitiveStarters * 5;
    reasons.push("Repetitive sentence starters detected");
  }

  // Check for lack of personal pronouns (AI often avoids "I", "my", "me")
  const personalPronouns = (text.match(/\b(i|my|me|myself)\b/gi) || []).length;
  const wordCount = text.split(/\s+/).length;
  const pronounRatio = personalPronouns / wordCount;
  
  if (pronounRatio < 0.01 && wordCount > 100) {
    score += 10;
    reasons.push("Very low use of personal pronouns");
  }

  // Check for overly perfect punctuation and formatting
  const perfectPunctuation = !text.match(/[a-z],[a-z]/i) && // No missing spaces after commas
                            !text.match(/\s{2,}/) && // No double spaces
                            text.match(/[.!?]\s+[A-Z]/g)?.length === sentences.length - 1;
  
  if (perfectPunctuation && wordCount > 50) {
    score += 8;
    reasons.push("Unusually perfect punctuation and formatting");
  }

  // Check for bullet points or numbered lists (common in AI responses)
  const hasBulletPoints = /^\s*[-•*]\s+/m.test(text) || /^\s*\d+[.)]\s+/m.test(text);
  if (hasBulletPoints) {
    score += 5;
    reasons.push("Contains structured bullet points or numbered lists");
  }

  // Check for hedging language (AI often hedges)
  const hedgingPhrases = [
    "it's worth noting", "it should be noted", "one might say",
    "arguably", "potentially", "possibly", "perhaps",
    "it could be said", "some might argue", "generally speaking"
  ];
  
  let hedgingCount = 0;
  for (const phrase of hedgingPhrases) {
    if (lowerText.includes(phrase)) {
      hedgingCount++;
    }
  }
  
  if (hedgingCount > 2) {
    score += hedgingCount * 4;
    reasons.push("Excessive hedging language");
  }

  // Normalize score to 0-100
  score = Math.min(score, 100);

  return {
    isAI: score >= 40,
    score,
    reasons: reasons.length > 0 ? reasons : ["No significant AI indicators found"]
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
    const { data: session, error: sessionError } = await supabase
      .from("custom_sessions")
      .select("user_id, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
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

    if (userError || !user || !["admin", "staff", "moderator"].includes(user.role)) {
      return new Response(JSON.stringify({ error: "Unauthorized - Staff access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId } = await req.json();

    if (!applicationId) {
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

    // Perform AI detection
    const result = detectAIContent(combinedText);

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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
