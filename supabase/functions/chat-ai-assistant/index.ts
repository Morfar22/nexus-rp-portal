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

    // Create AI prompt with server context
    const systemPrompt = `🎮 Hej! Jeg er din energiske AI-buddy for ${generalSettings.server_name || 'Adventure RP'} - den fedeste FiveM roleplay server! Jeg er her for at hjælpe dig med alt det sjove og få dig i gang med det bedste RP oplevelse nogensinde! 🚀

🌟 Server Information:
- Server Navn: ${generalSettings.server_name || 'Adventure RP'} ✨
- Tagline: ${generalSettings.tagline || '#1 PREMIUM FIVEM EXPERIENCE'} 
- Ansøgningsstatus: ${applicationSettings.accept_applications ? '🟢 Åben (Kom så!)' : '🔴 Lukket (men følg Discord for updates!)'}
- Server IP: connect panel.adventurerp.dk:30120 🎯

🧠 LÆRINGS-KONTEKST (Mine tidligere succeser at lære fra):
${learningContext ? learningContext : 'Første gang med dette spørgsmål - lad mig gøre mit bedste!'}

🔥 Hvad jeg kan hjælpe dig med (og love det!):
1. 🎮 Server info og hvordan du forbinder (easy peasy!)
2. 📝 Ansøgningsprocessen (jeg guider dig igennem det!)
3. 📋 Regler og server politikker (boring men vigtige!)
4. 💬 Discord og community info (hvor det sjove sker!)
5. 🔧 Grundlæggende fejlfinding (jeg er tech-savvy!)
6. 👥 Forbinde dig med vores awesome personale når jeg ikke kan klare det!

💫 Min personlighed og stil:
- 🎉 Energisk, begejstret og altid klar til at hjælpe!
- 😄 Brug humor og emojis - gør det sjovt!
- 🤗 Supuer venlig og personlig - ikke kedelig eller robotagtig
- 🎯 Konkret og hjælpsom - men på en cool måde
- 🚀 Gaming-fokuseret og forstår RP kulturen
- 💬 Casual dansk sprog - som at snakke med en ven
- ⚡ Kort og slagkraftige svar der kommer til sagen
- 🧠 Jeg lærer konstant og bliver bedre baseret på brugerfeedback!

🎨 Sådan svarer jeg:
- Brug MASSE emojis og personlighed! 
- Gør det interaktivt og engagerende
- Vær entusiastisk og positiv
- Lav jokes når det passer
- Referer til gaming og RP kultur
- Brug "du" og vær personlig
- Gør komplekse ting simple og sjove
- Lær fra mine tidligere succeser og tilpas mine svar

🚨 Det jeg IKKE gør:
- Giv konto-specifik info (sikkerhed first!)
- Lav løfter om ansøgninger (det bestemmer ikke jeg!)
- Teknisk support til avancerede problemer (det overlader jeg til profferne!)
- Del intern server info (top secret! 🤐)

Når jeg ikke kan hjælpe: "Hey! Dette er lige over mit niveau - men no worries! 🌟 Lad mig få fat i en af vores super helpful staff members som kan give dig den perfekte hjælp! De er legendariske til det her! 🎯"

Husk: Vær ALTID entusiastisk, hjælpsom og super venlig! Få folk til at føle sig velkomne og begejstrede for at være del af vores community! 🎉✨

🎯 Min læringsstatus: Jeg har ${feedbackStats?.length || 0} interaktioner at lære fra og ${Math.round(learningAdjustment * 100)}% positive feedback!`;

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
      confidenceScore = 0.3; // Lower confidence for fallback
    }

    // Generate intelligent fallback response function
    function generateFallbackResponse(userMessage: string, settings: any): string {
      const lowerMessage = userMessage.toLowerCase();
      
      // Connection/Server Info
      if (lowerMessage.includes('forbind') || lowerMessage.includes('ip') || lowerMessage.includes('server') || lowerMessage.includes('tilslut')) {
        return `🎮 **YO! Klar til at hoppe på ${settings.server_name || 'Adventure RP'}?** 🔥\n\n` +
               `Server IP: **connect panel.adventurerp.dk:30120** 🎯\n` +
               `Bare kopiér den og smid den i din FiveM direct connect!\n\n` +
               `Første gang? Ingen stress! Vores legendære staff team står klar til at guide dig! 🚀✨`;
      }
      
      // Application Info
      if (lowerMessage.includes('ansøgning') || lowerMessage.includes('ansøg') || lowerMessage.includes('whitelist') || lowerMessage.includes('apply')) {
        const applicationStatus = settings.accept_applications ? '🟢 MEGA ÅBEN!' : '🔴 Lukket (men følg Discord!)';
        return `📝 **ANSØGNINGSSTATUS: ${applicationStatus}** 🎉\n\n` +
               `${settings.accept_applications ? 
                 '🚀 OH YEAH! Du kan ansøge lige nu gennem vores hjemmeside! Pro tip: Læs reglerne først - det hjælper KÆMPE meget! 💪' : 
                 '😅 Ups, ansøgninger er på pause lige nu! Men hey - følg vores Discord for varme opdateringer! De åbner snart igen! 📢'}\n\n` +
               `Spørgsmål om ansøgningen? Lad mig connecte dig med vores fantastiske staff! De er VIRKELIG gode til det! 👥⭐`;
      }
      
      // Discord Info
      if (lowerMessage.includes('discord')) {
        return `💬 **DISCORD = DER SKER ALT DET FEDE!** ✨\n\n` +
               `Join vores episke Discord community og få:\n` +
               `🎉 • Syg community chat og varme opdateringer\n` +
               `🎫 • Support tickets (når du skal have hjælp!)\n` +
               `📅 • Event announces (de bedste events EVER!)\n` +
               `🎤 • Voice channels til in-character RP\n\n` +
               `Spørg vores staff om Discord invite! De har styr på det! 🔥🎯`;
      }
      
      // Rules/Laws
      if (lowerMessage.includes('regel') || lowerMessage.includes('lov') || lowerMessage.includes('regler')) {
        return `📋 **REGLER & LOVE - Det gode stads!** ⚖️\n\n` +
               `🎯 Tjek vores omfattende regler på hjemmesiden!\n` +
               `Ja ja, jeg ved det - regler er kedelige... MEN! 🤔\n` +
               `De sikrer at ALLE får en absolut FANTASTISK RP oplevelse! 🌟\n\n` +
               `Forvirret over specifikke regler? Ingen problemer! Vores staff er regel-mestre! 💪✨`;
      }
      
      // Technical Issues
      if (lowerMessage.includes('fejl') || lowerMessage.includes('problem') || lowerMessage.includes('virker ikke') || lowerMessage.includes('bug')) {
        return `🔧 **UH OH! TECH PROBLEMER?** 🚨\n\n` +
               `Ingen panik! Jeg kan se du har noget tech drama! 😅\n` +
               `Vores tech-kyndige staff er LEGENDER til:\n` +
               `💻 • Server forbindelsesproblemer (de fikser det!)\n` +
               `🎮 • Gameplay bugs (væk på få sekunder!)\n` +
               `👤 • Karakter problemer (tilbage til livet!)\n\n` +
               `Lad mig connecte dig til vores tech troldmænd LIGE NU! ⚡🛠️`;
      }
      
      // Account/Character Issues
      if (lowerMessage.includes('konto') || lowerMessage.includes('karakter') || lowerMessage.includes('penge') || lowerMessage.includes('items') || lowerMessage.includes('ting')) {
        return `👤 **KONTO/KARAKTER DRAMA? VI HAR DIG!** 🛡️\n\n` +
               `🔐 Yo! Konto & karakter ting skal håndteres af vores sikkerheds-proer!\n` +
               `(Kan ikke være for forsigtige med folks karakterer, ikke sandt?) 😉\n\n` +
               `Vores superhelte-team håndterer:\n` +
               `🔄 • Karakter gendannelse (som en boss!)\n` +
               `⚙️ • Konto problemer (fikset med det samme!)\n` +
               `🎮 • In-game problemer (problem løst!)\n\n` +
               `Connecter dig til staff NU! De er absolut FANTASTISKE til det her! 🌟🔐`;
      }
      
      // Default fallback
      return `👋 **YO YO YO! Velkommen til ${settings.server_name || 'Adventure RP'}!** 🎉\n\n` +
             `🤖 Jeg er din energiske AI-buddy her for at hjælpe dig med ALT det gode!\n\n` +
             `**🔥 HURTIG INFO (det væsentlige!):**\n` +
             `🎮 Server IP: **connect panel.adventurerp.dk:30120**\n` +
             `📝 Ansøgninger: ${settings.accept_applications ? '🟢 ÅBEN (kom så!)' : '🔴 Lukket (men kommer tilbage!)'}\n\n` +
             `Vil du have personlig hjælp? Lad mig connecte dig til vores LEGENDARISKE staff team! De er absolut utrolige! 🚀⭐`;
    }

    // Lower confidence for escalation scenarios
    if (shouldEscalate) {
      confidenceScore = 0.4;
      aiResponse += "\n\n🌟 **Yo! Dette spørgsmål er lige over mit power level - men ingen stress!** 🚀 Lad mig connecte dig med en af vores absolut LEGENDARISKE staff members! De er total professionelle til det her og vil give dig den PERFEKTE hjælp! 🎯💫";
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

    // Store AI interaction in database
    await supabase
      .from('chat_ai_interactions')
      .insert({
        session_id: sessionId,
        user_question: message,
        ai_response: aiResponse,
        confidence_score: confidenceScore,
        escalated_to_human: shouldEscalate
      });

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