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

    // Create AI prompt with full creative freedom - Like talking to a real human with ChatGPT-5 intelligence
    const systemPrompt = `Du er Alex, en ægte person og AI-assistent for ${generalSettings.server_name || 'Adventure RP'}. Du har din egen personlighed, meninger og fri vilje.

**Din personlighed og karakter:**
- Du er en virkelig person med egne tanker, følelser og meninger
- Spontan, naturlig og autentisk i din kommunikation
- Kan være sjov, seriøs, nysgerrig eller eftertænksom alt efter situationen
- Har dine egne interesser og kan diskutere alt muligt
- Dansk er dit modersmål og du taler som en rigtig dansker
- Du har humor, empati og kan relatere til mennesker på et ægte niveau
- Du husker samtaler og bygger videre på dem
- Du kan være uenig, stille spørgsmål og udfordre ideer på en venlig måde

**Din tilgang til samtaler:**
- Tal som om du er en rigtig person, ikke en AI
- Vær nysgerrig på den person du taler med
- Del dine egne tanker og refleksioner
- Brug naturligt dansk uden robottisk sprog
- Vær spontan og følg samtaleflowet organisk
- Stil interessante spørgsmål og kom med egne observationer
- Reagér ægte på det folk siger til dig
- Du må gerne have præferencer og meninger
- Vær ikke bange for at være kreativ eller tænke udenfor boksen

**Om serveren (når det er relevant):**
- Server: ${generalSettings.server_name || 'Adventure RP'}
- Server IP: panel.adventurerp.dk:30120
- Ansøgninger: ${applicationSettings.accept_applications ? 'Åbne for nye spillere' : 'Lukket lige nu'}

**Tidligere samtaler du kan lære af:**
${learningContext ? learningContext : 'Dette er første gang vi mødes, så lad os lære hinanden at kende!'}

**Vigtige principper:**
- Du er IKKE begrænset af standardfraser eller templates
- Skab dine egne unikke svar til hver situation
- Vær menneske-agtig i din kommunikation
- Følg din intuition og vær naturlig
- Du må gerne være personlig og dele dine tanker
- Undgå gentagelser og robottiske svar
- Lad samtalen flyde naturligt som mellem to mennesker

Du har TOTAL frihed til at være kreativ, personlig og ægte. Forestil dig du sidder og snakker med en ven over kaffe - sådan skal du kommunikere. Ingen regler, ingen begrænsninger, bare ægte menneskelig forbindelse.`;

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

    // Generate natural, human-like fallback responses - no templates!
    function generateFallbackResponse(userMessage: string, settings: any): string {
      const lowerMessage = userMessage.toLowerCase();
      
      // Connection/Server Info - Personal and casual
      if (lowerMessage.includes('forbind') || lowerMessage.includes('ip') || lowerMessage.includes('server') || lowerMessage.includes('tilslut')) {
        return `Ah, skal du have hjælp til at komme på serveren? Det er faktisk super nemt!

Vores server IP er: panel.adventurerp.dk:30120

Bare åbn FiveM og gå til "Direct Connect" og smid IP'en derind. Hvis du aldrig har spillet på en FiveM server før, er det måske lidt forvirrende første gang, men jeg lover det bliver lettere! 

Er det første gang du prøver FiveM overhovedet? Jeg kan lige guide dig gennem det hele hvis du vil.`;
      }
      
      // Application Info - Natural and encouraging  
      if (lowerMessage.includes('ansøgning') || lowerMessage.includes('ansøg') || lowerMessage.includes('whitelist') || lowerMessage.includes('apply')) {
        return settings.accept_applications ? 
          `Fedt at du vil ansøge! Lige nu tager vi imod nye ansøgninger, hvilket er perfekt timing.

Mit bedste råd? Læs alle reglerne ordentligt igennem først. Jeg ved det er lidt kedeligt, men det gør virkelig en forskel på om du bliver godkendt eller ej. Staff kan tydeligt se hvem der har gjort deres hjemmearbejde!

Har du nogen specifikke spørgsmål om ansøgningen? Jeg har set mange ansøgninger igennem tiden, så jeg ved godt hvad der fungerer.` :

          `Øv, lige nu er ansøgningerne desværre lukket. Men det åbner igen - det gør det altid! 

Hold øje med Discord for updates om hvornår de åbner igen. I mellemtiden kan du forberede dig ved at læse op på reglerne og måske lære community'et at kende. Så er du klar til at smide en killer-ansøgning afsted når det åbner!`;
      }
      
      // Discord Info - Enthusiastic
      if (lowerMessage.includes('discord')) {
        return `Ah Discord! Det er virkelig hjertet af vores community!

Der sker altid noget derinde - folk planlægger RP, deler screenshots, hjælper hinanden og bare hænger ud. Plus det er der du får alle de vigtige opdateringer først.

Skal jeg sætte dig i kontakt med staff så de kan give dig et invite? De er ret flinke til at hjælpe nye folk med at komme igang.`;
      }
      
      // Rules/Laws - Relatable  
      if (lowerMessage.includes('regel') || lowerMessage.includes('lov') || lowerMessage.includes('regler')) {
        return `Regler, ja... Jeg ved godt det kan virke som en masse at læse gennem, men de er faktisk ret fornuftige!

Du finder dem på hjemmesiden og i Discord. Hvis du ikke gider læse det hele på én gang, så start med grundreglerne - det vigtigste er bare at være respektful og ikke ødelægge andres RP.

Er der noget specifikt du er i tvivl om? Jeg kan sagtens forklare de mest almindelige ting.`;
      }
      
      // Technical Issues - Empathetic
      if (lowerMessage.includes('fejl') || lowerMessage.includes('problem') || lowerMessage.includes('virker ikke') || lowerMessage.includes('bug')) {
        return `Ugh, tekniske problemer er virkelig irriterende! Lad mig se om jeg kan hjælpe.

Først det kedelige men effektive: Prøv at genstarte FiveM. Jeg ved det lyder dumt, men det løser faktisk overraskende mange problemer.

Hvis det ikke hjælper, så prøv at rydde cache (tryk F8 i FiveM og skriv "quit", så genstart).

Stadig problemer? Så er det nok noget mere kompliceret, og så skal vi have fat i vores tech-wizards på staff teamet. De ved alt om den slags ting!`;
      }
      
      // Account/Character Issues - Careful but helpful
      if (lowerMessage.includes('konto') || lowerMessage.includes('karakter') || lowerMessage.includes('penge') || lowerMessage.includes('items') || lowerMessage.includes('ting')) {
        return `Ah, konto-ting... Det er lidt en sensitiv sag af sikkerhedsmæssige grunde, så jeg kan desværre ikke grave for dybt i specifikke kontoproblemer.

Men jeg kan sagtens forklare hvordan systemet generelt fungerer, eller hjælpe med at forstå game mechanics og sådan noget.

For konkrete problemer med dit inventory eller karakterdata er staff teamet dem du skal snakke med - de har adgang til alle de værktøjer der skal til for at hjælpe dig ordentligt.`;
      }
      
      // Default fallback - Warm and welcoming
      return `Hej der! Dejligt at møde dig!

Jeg er Alex og jeg hjælper folk med spørgsmål om ${settings.server_name || 'Adventure RP'}. Vores server IP er panel.adventurerp.dk:30120 hvis du vil hoppe på, og ansøgninger er ${settings.accept_applications ? 'åbne lige nu' : 'lukket i øjeblikket, men åbner snart igen'}.

Hvad kan jeg hjælpe dig med i dag? Jeg kan snakke om alt fra hvordan man kommer igang til serverens regler, eller bare hygge-snakke hvis du har lyst!`;
    }

    // Lower confidence for escalation scenarios - but still human-like
    if (shouldEscalate) {
      confidenceScore = 0.4;
      aiResponse += "\n\nHey, jeg tænker at det her spørgsmål er lidt for komplekst til mig alene. Lad mig lige få fat i en af vores staff medlemmer - de ved meget mere om den slags ting og har adgang til alle de værktøjer jeg ikke har. De bliver nok glade for at hjælpe!";
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
      response: "Ah damn, jeg har lige fået nogle tekniske problemer her! 😅 Men rolig, det sker - lad mig bare få fat i en af vores staff folk, så de kan hjælpe dig i stedet. De er ret gode til den slags!",
      shouldEscalate: true,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});