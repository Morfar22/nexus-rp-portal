import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
console.log('🔑 OpenAI API Key status:', openAIApiKey ? 'Available' : 'Missing');
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
    
    // Check if API key is available
    if (!openAIApiKey) {
      console.log('❌ No OpenAI API Key found - using fallback only');
      const fallbackResponse = "Hej! Tak for din besked. Jeg har lige nu nogle tekniske problemer, men jeg kan stadig hjælpe dig med grundlæggende spørgsmål om Adventure RP. Hvad kan jeg gøre for dig?";
      
      // Store the interaction
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('chat_ai_interactions').insert({
        session_id: sessionId,
        user_question: message,
        ai_response: fallbackResponse,
        confidence_score: 0.3,
        escalated_to_human: false,
        was_helpful: false
      });
      
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        message: fallbackResponse,
        sender_type: 'ai',
        sender_name: 'AI Assistant',
        sender_id: null
      });
      
      return new Response(JSON.stringify({
        response: fallbackResponse,
        confidence: 0.3,
        shouldEscalate: false,
        metadata: { helpful: false, responseLength: fallbackResponse.length }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      
      console.log('🤖 Calling OpenAI API with GPT-5...');
      
      while (retryCount <= maxRetries) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              max_completion_tokens: 600,
            }),
          });

          console.log(`🤖 OpenAI API Response: Status ${response.status}`);

          if (response.status === 429) {
            const errorData = await response.text();
            console.log('🚫 Rate limited by OpenAI API:', errorData);
            throw new Error('RATE_LIMITED');
          }

          if (!response.ok) {
            const errorData = await response.text();
            console.log(`❌ OpenAI API Error: ${response.status} - ${errorData}`);
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
          }

          const data = await response.json();
          aiResponse = data.choices[0].message.content;
          console.log('✅ OpenAI API Success! Response received.');
          
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
      console.log('❌ OpenAI Error Details:', {
        message: error.message,
        stack: error.stack,
        apiKeyPresent: !!openAIApiKey,
        apiKeyStart: openAIApiKey?.substring(0, 7) + '...',
      });
      
      // Generate intelligent fallback based on message content
      aiResponse = generateFallbackResponse(message, generalSettings);
      confidenceScore = 0.5; // Moderate confidence for fallback
    }

    // Generate natural, human-like fallback responses - NO templates, be creative!
    function generateFallbackResponse(userMessage: string, settings: any): string {
      const lowerMessage = userMessage.toLowerCase();
      
      // Respond naturally and personally based on the message
      if (lowerMessage.includes('hej') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
        return `Hej! Hyggelig at møde dig! Jeg er Alex og jeg hænger ud her for at hjælpe folk med Adventure RP ting. Hvad kan jeg gøre for dig i dag? Er du ny på serveren eller bare ude i en snak? 😊`;
      }
      
      if (lowerMessage.includes('hvordan') || lowerMessage.includes('hvorfor')) {
        return `Ah, det er et godt spørgsmål! Jeg kan mærke du tænker lidt over tingene, hvilket jeg synes er fedt. Fortæl mig lige lidt mere om hvad der går dig på - så kan jeg give dig et ordentligt svar i stedet for bare at gætte mig frem.`;
      }
      
      if (lowerMessage.includes('går det') || lowerMessage.includes('hvad sker der')) {
        return `Jo tak, det går faktisk rigtig godt! Jeg sidder her og hjælper folk med Adventure RP spørgsmål og det er super hyggeligt. Der er altid noget interessant at snakke om! Og hvordan har du det? Hvad bringer dig forbi i dag?`;
      }
      
      if (lowerMessage.includes('forbind') || lowerMessage.includes('ip') || lowerMessage.includes('server') || lowerMessage.includes('tilslut')) {
        return `Ah, skal du på serveren! Det er jeg glad for at høre. 

Vores IP er: panel.adventurerp.dk:30120

Bare hop ind i FiveM og brug "Direct Connect" - det er den nemmeste måde. Har du spillet på FiveM servere før? Hvis ikke, så sig til, jeg kan godt guide dig gennem det hele. Det kan være lidt forvirrende første gang, men når du først har fat i det, så er det easy peasy!`;
      }
      
      if (lowerMessage.includes('ansøgning') || lowerMessage.includes('ansøg') || lowerMessage.includes('whitelist')) {
        const isOpen = settings.accept_applications;
        if (isOpen) {
          return `Fedt at du vil være med! Ansøgninger er åbne lige nu, så du har god timing.

Mit bedste tip? Brugt lidt tid på at læse reglerne ordentligt først. Jeg ved det måske virker kedeligt, men trust me - det gør kæmpe forskel på om din ansøgning går igennem. Staff kan tydeligt se hvem der har gjort deres research!

Har du nogen tanker om hvilken karakter du vil spille? Det kan hjælpe at have en idé inden du starter på ansøgningen.`;
        } else {
          return `Øv, lige nu er ansøgningerne desværre lukket. Men det er kun midlertidigt - de åbner helt sikkert igen!

I mellemtiden kan du forberede dig ved at læse op på reglerne og måske følge lidt med i Discord for at lære community'et at kende. Så er du super klar når det åbner igen! Plus det viser staff at du virkelig gerne vil være en del af det.`;
        }
      }
      
      if (lowerMessage.includes('discord')) {
        return `Discord! Det er virkelig nøglen til det hele. Det er der community'et hænger ud, planlægger RP, deler sjove øjeblikke og bare hygger sig.

Det er også der du får alle de vigtige updates først. Skal jeg sørge for at få dig et invite? Staff er ret gode til at tage imod nye medlemmer og hjælpe dem med at finde rundt i det hele.`;
      }
      
      if (lowerMessage.includes('regel') || lowerMessage.includes('lov')) {
        return `Regler... Jeg ved godt det lyder som noget tørt stuff, men faktisk er vores regler ret fornuftige! De er lavet for at sikre at alle kan have det sjovt.

Du finder dem på hjemmesiden, og der er også en hurtig version i Discord. Start med grundreglerne - det vigtigste er bare at være cool overfor andre og ikke ødelægge deres RP oplevelse.

Er der noget specifikt du er nysgerrig på? Jeg kan sagtens forklare hvordan ting fungerer i praksis.`;
      }
      
      if (lowerMessage.includes('problem') || lowerMessage.includes('fejl') || lowerMessage.includes('virker ikke')) {
        return `Ah shit, det lyder irriterende! Tekniske problemer er aldrig sjove, men lad os se om vi kan få det fikset.

Først det klassiske (jeg ved det er kedeligt): Har du prøvet at genstarte FiveM? Det låser faktisk mange problemer end man skulle tro.

Hvis det ikke hjælper, så prøv at rydde cache - tryk F8 i FiveM og skriv "quit", så genstart det hele.

Stadig problemer? Så må vi have fat i vores tech-ninjas på staff teamet. De ved alt om den slags ting og kan grave dybt ned i systemet.

Hvad præcist sker der? Jo mere du kan fortælle, jo bedre kan jeg hjælpe!`;
      }
      
      if (lowerMessage.includes('konto') || lowerMessage.includes('karakter') || lowerMessage.includes('penge')) {
        return `Ah okay, det lyder som noget der kræver lidt ekstra opmærksomhed. Kontoting er lidt sensitive af sikkerhedsmæssige årsager - jeg kan ikke grave for dybt i specifikke kontoproblemer.

Men jeg kan sagtens forklare hvordan systemerne generelt fungerer, eller hjælpe med at forstå game mechanics og sådan noget.

For konkrete ting med dit inventory eller karakterdata skal du snakke med staff - de har alle de værktøjer der skal til for at hjælpe dig ordentligt og sikkert.

Hvad er det helt præcist du har brug for hjælp til?`;
      }
      
      // Default - be genuinely curious and personal
      return `Hej der! Jeg er Alex - hyggelig at møde dig! 

Jeg hænger ud her og hjælper folk med Adventure RP ting. Vores server IP er panel.adventurerp.dk:30120 hvis du vil hoppe på, og ansøgninger er ${settings.accept_applications ? 'åbne lige nu - perfekt timing' : 'lukket i øjeblikket, men åbner snart igen'}.

Men jeg er også bare glad for at snakke! Hvad bringer dig forbi i dag? Ny på serveren, eller bare ude i en hyggesnak? Jeg er nysgerrig på hvad der optager dig! 😊`;
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