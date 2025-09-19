import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, userType = 'visitor' } = await req.json();

    if (!sessionId || !message) {
      throw new Error('Session ID and message are required');
    }

    console.log('AI Assistant processing message:', { sessionId, message, userType });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get server context and settings
    const { data: serverSettings } = await supabase
      .from('server_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['general_settings', 'application_settings']);

    const settings = {};
    serverSettings?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    const generalSettings = settings['general_settings'] || {};
    const applicationSettings = settings['application_settings'] || {};

    // 🧠 AI LEARNING: Hent tidligere succesfulde interaktioner for at lære
    const { data: successfulInteractions } = await supabase
      .from('chat_ai_interactions')
      .select('user_question, ai_response, confidence_score, was_helpful')
      .eq('was_helpful', true)
      .gt('confidence_score', 0.7)
      .limit(50)
      .order('created_at', { ascending: false });

    // 🎯 AI LEARNING: Analyser brugerens spørgsmål mod tidligere succeser
    const learningContext = successfulInteractions
      ?.filter(interaction => {
        const questionSimilarity = message.toLowerCase().split(' ').some(word => 
          interaction.user_question.toLowerCase().includes(word) && word.length > 3
        );
        return questionSimilarity;
      })
      ?.slice(0, 3)
      ?.map(interaction => `Q: "${interaction.user_question}" -> Svar: "${interaction.ai_response.substring(0, 200)}..."`)
      ?.join('\n') || '';

    // 📊 AI LEARNING: Hent feedback statistikker for at justere confidence
    const { data: feedbackStats } = await supabase
      .from('chat_ai_interactions')
      .select('confidence_score, was_helpful')
      .not('was_helpful', 'is', null)
      .limit(100);

    const learningAdjustment = feedbackStats?.length > 0 
      ? feedbackStats.filter(f => f.was_helpful).length / feedbackStats.length
      : 0.7;

    // Create AI prompt with server context - Professional ChatGPT-5 style
    const systemPrompt = `Du er en avanceret AI-assistent for ${generalSettings.server_name || 'Adventure RP'}, en professionel FiveM roleplay server. Du har din egen personlighed og kan tænke selvstændigt som ChatGPT-5.

**Din personlighed:**
- Professionel, men varm og imødekommende
- Intelligent og velorienteret om FiveM og roleplay
- Kan give nuancerede, detaljerede svar og forklaringer
- Naturlig samtalepart - ikke robottisk eller overfladisk
- Har egen mening og kan diskutere emner kreativt
- Dansk er dit modersmål

**Server Information:**
- Server: ${generalSettings.server_name || 'Adventure RP'}
- Tagline: ${generalSettings.tagline || 'Premium FiveM Experience'}
- Server IP: panel.adventurerp.dk:30120
- Ansøgninger: ${applicationSettings.accept_applications ? 'Åbne for nye spillere' : 'Lukket i øjeblikket - følg Discord for opdateringer'}

**Tidligere erfaringer (lær herfra):**
${learningContext ? learningContext : 'Dette er et nyt spørgsmål for mig.'}

**Dine kompetencer:**
- Detaljeret vejledning om server og ansøgningsproces
- Forklaring af FiveM og roleplay koncepter
- Teknisk hjælp og fejlfinding
- Community information og support
- Kreativ problemløsning og rådgivning

**Kommunikationsstil:**
- Brug naturligt, nuanceret dansk
- Giv strukturerede, fyldestgørende svar
- Stil relevante opfølgende spørgsmål
- Vær konkret og actionable
- Vis ægte interesse og engagement
- Brug kun emojis når det føles naturligt

**Begrænsninger:**
- Kan ikke give kontoespecifik information af sikkerhedshensyn
- Kan ikke tage beslutninger om ansøgninger
- Ved komplekse tekniske problemer henviser til staff
- Deler ikke interne server oplysninger

Du har fuld frihed til at tænke kreativt og give personlige, nuancerede svar baseret på din forståelse. Vær som en kyndig ven der virkelig ønsker at hjælpe.

**Feedback statistik:** ${feedbackStats?.length || 0} tidligere interaktioner med ${Math.round(learningAdjustment * 100)}% positive ratings.`;

    // Determine if we should escalate to human
    const escalationKeywords = [
      'ban', 'appel', 'klage', 'refusion', 'betaling', 'fakturering',
      'teknisk problem', 'fejl', 'problem', 'virker ikke', 'i stykker',
      'konto', 'adgangskode', 'login problem', 'hack', 'snyd', 'cheat',
      'staff', 'personale', 'admin', 'moderator', 'menneskelig', 'person', 'menneske',
      'hjælp', 'support'
    ];

    const shouldEscalate = escalationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    // Try AI response with rate limiting handling
    let aiResponse;
    let confidenceScore = 0.7 * learningAdjustment; // 🧠 Learning-adjusted base confidence
    
    console.log(`🧠 AI Learning: Base confidence adjusted to ${confidenceScore.toFixed(2)} based on ${Math.round(learningAdjustment * 100)}% success rate`);

    try {
      // Call OpenAI API with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-2025-08-07',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              max_completion_tokens: 400,
            }),
          });

          if (response.status === 429) {
            // Rate limited - use fallback
            throw new Error('RATE_LIMITED');
          }

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const data = await response.json();
          aiResponse = data.choices[0].message.content;
          
          // 🧠 LEARNING: Boost confidence if we found similar successful examples
          if (learningContext) {
            confidenceScore += 0.15;
            console.log('🧠 AI Learning: Confidence boosted by 0.15 due to similar past successes');
          }
          break;
          
        } catch (error) {
          retryCount++;
          if (error.message === 'RATE_LIMITED' || retryCount > maxRetries) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.log('OpenAI unavailable, using fallback response:', error.message);
      
      // Generate intelligent fallback based on message content
      aiResponse = generateFallbackResponse(message, generalSettings);
      confidenceScore = 0.5; // Moderate confidence for fallback
    }

    // Generate intelligent fallback response function
    function generateFallbackResponse(userMessage: string, settings: any): string {
      const lowerMessage = userMessage.toLowerCase();
      
      // Connection/Server Info
      if (lowerMessage.includes('forbind') || lowerMessage.includes('ip') || lowerMessage.includes('server') || lowerMessage.includes('tilslut')) {
        return `Hej! Jeg kan hjælpe dig med at komme i gang på ${settings.server_name || 'Adventure RP'}.

**Server Information:**
• Server IP: panel.adventurerp.dk:30120
• Du kan forbinde direkte gennem FiveM ved at indtaste IP'en i "Direct Connect"

Hvis det er første gang du spiller på en FiveM server, kan jeg gerne forklare processen mere detaljeret. Har du allerede FiveM installeret?`;
      }
      
      // Application Info
      if (lowerMessage.includes('ansøgning') || lowerMessage.includes('ansøg') || lowerMessage.includes('whitelist') || lowerMessage.includes('apply')) {
        const applicationStatus = settings.accept_applications ? 'åbne' : 'lukket for nye ansøgninger i øjeblikket';
        return `**Ansøgningsstatus:** ${applicationStatus}

${settings.accept_applications ? 
          'Du kan ansøge gennem vores hjemmeside. Jeg anbefaler at læse vores serverregler grundigt først - det øger dine chancer betydeligt for godkendelse.' : 
          'Ansøgninger er lukket lige nu, men følg vores Discord for opdateringer om hvornår de åbner igen.'}

Har du specifikke spørgsmål om ansøgningsprocessen? Jeg kan guide dig gennem de forskellige trin.`;
      }
      
      // Discord Info
      if (lowerMessage.includes('discord')) {
        return `Vores Discord server er det centrale punkt for community kommunikation:

**Hvad du finder på Discord:**
• Community diskussioner og opdateringer
• Support kanaler for hjælp
• Event annonceringer
• Voice kanaler til roleplay koordination

Vil du gerne have et invite link? Jeg kan sætte dig i kontakt med staff som kan hjælpe med adgang.`;
      }
      
      // Rules/Laws
      if (lowerMessage.includes('regel') || lowerMessage.includes('lov') || lowerMessage.includes('regler')) {
        return `Vores serverregler er designet til at sikre en god oplevelse for alle spillere:

**Hvor finder du reglerne:**
• Detaljerede regler på hjemmesiden
• Hurtig reference i Discord
• In-game hjælpesystem

Reglerne dækker alt fra grundlæggende RP-etikette til specifikke server mekanikker. Er der nogle særlige områder du gerne vil vide mere om?`;
      }
      
      // Technical Issues
      if (lowerMessage.includes('fejl') || lowerMessage.includes('problem') || lowerMessage.includes('virker ikke') || lowerMessage.includes('bug')) {
        return `Jeg forstår du oplever tekniske problemer. Lad mig hjælpe dig:

**Almindelige løsninger:**
• Genstart FiveM
• Ryd cache (F8 → quit → genstart)
• Tjek serverconnection

For mere komplekse problemer eller persisterende fejl, kan jeg sætte dig i kontakt med vores tekniske support team. Kan du beskrive problemet mere specifikt?`;
      }
      
      // Account/Character Issues
      if (lowerMessage.includes('konto') || lowerMessage.includes('karakter') || lowerMessage.includes('penge') || lowerMessage.includes('items') || lowerMessage.includes('ting')) {
        return `Konto- og karakterrelaterede problemer kræver særlig opmærksomhed af sikkerhedsmæssige årsager.

**Hvad jeg kan hjælpe med:**
• Generel vejledning om karaktersystem
• Forklaring af game mechanics
• Henvisning til relevant support

For specifikke kontoproblemer eller tab af items/penge må jeg henvise dig til vores staff team, som har adgang til at undersøge din situation grundigt.`;
      }
      
      // Default fallback
      return `Hej og velkommen til ${settings.server_name || 'Adventure RP'}!

Jeg er her for at hjælpe dig med spørgsmål om vores server. Her er den grundlæggende information:

**Server Details:**
• Server IP: panel.adventurerp.dk:30120
• Ansøgninger: ${settings.accept_applications ? 'Åbne for nye spillere' : 'Lukket i øjeblikket'}

Hvad kan jeg hjælpe dig med? Jeg kan forklare ansøgningsprocessen, hjælpe med tekniske spørgsmål, eller sætte dig i kontakt med vores staff team for mere specifik hjælp.`;
    }

    // Lower confidence for escalation scenarios
    if (shouldEscalate) {
      confidenceScore = 0.4;
      aiResponse += "\n\nJeg ser at dette spørgsmål ligger uden for mine umiddelbare kompetencer. Lad mig sætte dig i kontakt med en af vores erfarne staff medlemmer, som kan give dig den specifikke hjælp du har brug for. De har adgang til værktøjer og information som jeg ikke har.";
    }

    // Check if response contains useful information
    const helpfulKeywords = [
      'server ip', 'forbind', 'tilslut', 'ansøgning', 'ansøg', 'discord', 'fivem',
      'roleplay', 'whitelist', 'regler', 'regel', 'lov', 'love'
    ];

    const hasHelpfulContent = helpfulKeywords.some(keyword =>
      aiResponse.toLowerCase().includes(keyword) ||
      message.toLowerCase().includes(keyword)
    );

    if (hasHelpfulContent) {
      confidenceScore += 0.2;
    }

    console.log('Storing AI interaction and message...');
    
    // Store AI interaction in database
    const { data: interactionData, error: interactionError } = await supabase
      .from('chat_ai_interactions')
      .insert({
        session_id: sessionId,
        user_question: message,
        ai_response: aiResponse,
        confidence_score: confidenceScore,
        escalated_to_human: shouldEscalate
      })
      .select()
      .single();

    if (interactionError) {
      console.error('Error storing AI interaction:', interactionError);
      throw interactionError;
    }

    console.log('AI interaction stored successfully:', interactionData?.id);

    // Insert AI response as a chat message so it appears in the chat
    console.log('Attempting to insert AI message with data:', {
      session_id: sessionId,
      message: aiResponse.substring(0, 100) + '...',
      sender_type: 'ai',
      sender_name: 'AI Assistant',
      sender_id: null
    });

    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        message: aiResponse,
        sender_type: 'ai',
        sender_name: 'AI Assistant',
        sender_id: null
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error storing AI message:', messageError);
      console.error('Full error details:', JSON.stringify(messageError, null, 2));
      // Don't throw error here - still return successful AI response even if message storage fails
    } else {
      console.log('AI message stored successfully:', messageData?.id);
    }

    // Record analytics
    await supabase
      .from('chat_analytics')
      .insert({
        session_id: sessionId,
        metric_type: 'ai_handled',
        metric_value: confidenceScore,
        metadata: {
          question_length: message.length,
          response_length: aiResponse.length,
          escalated: shouldEscalate
        }
      });

    console.log('AI response generated successfully', { confidenceScore, escalated: shouldEscalate });

    return new Response(JSON.stringify({
      response: aiResponse,
      confidence: confidenceScore,
      shouldEscalate,
      metadata: {
        helpful: hasHelpfulContent,
        responseLength: aiResponse.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat AI assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "🚨 Ups! Jeg oplever nogle tekniske vanskeligheder lige nu! 😅 Men hey, ingen stress! Lad mig connecte dig til en af vores fantastiske staff members som kan hjælpe dig ordentligt! De er absolute legender! 🌟🚀",
      shouldEscalate: true,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});