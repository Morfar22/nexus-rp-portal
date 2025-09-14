import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Palette, Wand2, FileText, Image, Download, Copy,
  Sparkles, Brush, Type, Camera, Video, Music, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreativeProject {
  id: string;
  title: string;
  type: 'content' | 'image' | 'banner' | 'logo' | 'video' | 'audio';
  content: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

const CreativeTools = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');

  // AI Content Generator
  const [contentPrompt, setContentPrompt] = useState('');
  const [contentType, setContentType] = useState<'story' | 'description' | 'announcement' | 'rules'>('story');

  // Image Generator
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<'realistic' | 'artistic' | 'cartoon' | 'cyberpunk'>('realistic');
  const [imageSize, setImageSize] = useState<'512x512' | '1024x1024' | '1920x1080'>('1024x1024');

  // Banner Creator
  const [bannerText, setBannerText] = useState('');
  const [bannerStyle, setBannerStyle] = useState<'gaming' | 'minimal' | 'neon' | 'retro'>('gaming');
  const [bannerColor, setBannerColor] = useState('#6366f1');

  const generateAIContent = async () => {
    if (!contentPrompt.trim()) {
      toast({
        title: t('common.error'),
        description: t('creative.error_no_prompt'),
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate professional creative content directly without relying on external AI
      const enhancedContent = generateCreativeContent(contentType, contentPrompt);
      setGeneratedContent(enhancedContent);
      
      toast({
        title: t('common.success'),
        description: t('creative.success_generated')
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: t('common.error'),
        description: t('creative.error_generation_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCreativeContent = (type: string, prompt: string): string => {
    const promptLower = prompt.toLowerCase();
    
    const templates = {
      story: `# 📖 **${prompt} - En Adventure RP Historie**

## **Indledning**
I Adventure RP's cyberpunk-inspirerede verden, hvor neonlys reflekteres i regnvåde gader og teknologi møder gritty realisme, udspiller sig en dramatisk historie omkring **${prompt}**.

## **Karakterer og Setting** 
Vores historie finder sted i Neo-Copenhagen, hvor **${prompt}** bliver det centrale element i en større sammenhæng. Karaktererne navigerer gennem:

• **Downtown District**: Byens pulserende hjerte med corporate towers og underground scener
• **Industrial Zone**: Hvor de store deals går ned og farerne lurer
• **Residential Areas**: Hvor almindelige borgere forsøger at leve deres liv
• **The Underground**: Hemmelige netværk og skjulte agendaer

## **Konflikt og Drama**
Når **${prompt}** kommer i spil, opstår der et komplekst net af alliancer og rivaliseringer. Karaktererne må træffe svære valg:

**Protagonisten:** En kompleks figur der står over for moralske dilemmaer
**Antagonisterne:** Kræfter der arbejder imod protagonistens mål  
**Støttende karakterer:** Allierede som hver har deres egne motiver

## **Klimaks og Opløsning**
Historien når sit klimaks når sandheden om **${prompt}** bliver afsløret, og konsekvenserne ryster hele samfundet. 

**Resultatet:** Adventure RP er stedet hvor enhver historie kan udfolde sig naturligt gennem rollespil - og hvor **${prompt}** kan blive en del af den større narrative.

---
*💡 Brug denne historie som inspiration til dit roleplay på Adventure RP*`,

      description: `# 🎮 **${prompt} - Adventure RP Feature**

## **Hvad er ${prompt}?**
**${prompt}** er en central del af Adventure RP-oplevelsen, designet til at give spillere en realistisk og engagerende roleplay-mulighed.

## **🌟 Key Features**
### **Realistic Implementation**
• Autentiske gameplay-mekanikker baseret på rigtig verden
• Balanceret økonomi der belønner smart spil  
• Dynamiske interaktioner mellem spillere

### **Community Integration**
• **Staff Oversight**: Professionelt personale sikrer fair gameplay
• **Player Economy**: Påvirk serverens økonomi gennem dine handlinger
• **Character Development**: Udvikl din karakter over tid

### **Technical Excellence**
• **Custom Scripts**: Specialudviklede systemer til **${prompt}**
• **Performance Optimized**: Smooth gameplay uden lag
• **Regular Updates**: Kontinuerlige forbedringer baseret på feedback

## **🎯 Hvordan kommer jeg i gang?**
1. **Læs reglerne** - Forstå hvordan **${prompt}** fungerer på serveren
2. **Opret din karakter** - Design en baghistorie der passer til **${prompt}**
3. **Find mentorer** - Vores erfarne spillere hjælper gerne nye
4. **Start småt** - Byg din reputation og netværk gradvist

## **💫 Adventure RP Fordele**
✅ **Professionelt Staff Team** - 24/7 support og moderation  
✅ **Aktiv Community** - Over 200 daglige spillere  
✅ **Custom Content** - Unikke features du ikke finder andre steder  
✅ **Stabil Performance** - Minimal downtime og optimeret for gameplay  

---
*🚀 Klar til at opleve ${prompt} på Adventure RP? Ansøg om whitelist i dag!*`,

      announcement: `# 📢 **VIGTIG MEDDELELSE: ${prompt}**

## **Kære Adventure RP Community**

Vi har vigtig information vedrørende **${prompt}** der påvirker alle spillere på serveren.

## **🔥 Hvad sker der?**
**${prompt}** introducerer nye muligheder og ændringer til vores server-oplevelse:

### **Umiddelbare Ændringer**
• **Nye Features**: Enhanced gameplay-muligheder 
• **System Updates**: Forbedrede performance og stabilitet
• **Community Events**: Kommende events relateret til **${prompt}**

### **Hvad betyder det for dig?**
🎯 **Positive Konsekvenser:**
- Forbedret roleplay-dybde og immersion
- Nye muligheder for karakterudvikling  
- Enhanced social interaktioner

⚠️ **Vigtige Punkter at Huske:**
- Læs opdaterede regler og guidelines
- Tilpas din roleplay-stil efter behov
- Spørg staff hvis du er i tvivl

## **📅 Tidsplan og Implementation**
**Fase 1** (Nu): Information og forberedelse  
**Fase 2** (Næste uge): Gradvis udrulning af features  
**Fase 3** (Løbende): Community feedback og justeringer  

## **🤝 Har du spørgsmål?**
Vores dedikerede staff team er klar til at hjælpe:

• **Discord Support**: Opret en ticket i #support-tickets
• **In-Game Help**: Kontakt administratorer via /report system  
• **Community Forum**: Diskuter med andre spillere

---
**Tak for jeres kontinuerlige support til Adventure RP! Sammen bygger vi den fedste RP-community! 🎉**

*- Adventure RP Leadership Team*`,

      rules: `# 📋 **REGEL GUIDE: ${prompt}**

## **🎯 Regel Forklaring**
**${prompt}** er en vigtig del af Adventure RP's regelsæt, designet til at sikre fair og sjov gameplay for alle.

## **📖 Detaljeret Beskrivelse**

### **Hvad omfatter denne regel?**
**${prompt}** refererer til specifikke handlinger og adfærd der enten er:
- ✅ **Tilladt og opmuntret** på serveren
- ❌ **Forbudt og kan resultere i sanktioner**
- ⚠️ **Betinget tilladt** under bestemte omstændigheder

### **🎭 Roleplay Kontekst**
I Adventure RP's cyberpunk setting skal **${prompt}** altid:
- Være realistisk og troværdig
- Passe ind i din karakters baghistorie
- Respektere andre spilleres oplevelse
- Følge server lore og timeline

## **✅ Acceptable Eksempler**
**Scenario 1:** [Beskrivelse af korrekt implementation]
- Følger regelns ånd og bogstav
- Enhancer gameplayet for alle involverede
- Viser respekt for andre spillere

**Scenario 2:** [Alternative acceptable approach]
- Kreativ men regelkonform tilgang
- Bidrager positivt til server-historien

## **❌ Uacceptable Eksempler**
**Scenario 1:** [Beskrivelse af forkert usage]
- Bryder regelns grundlæggende principper
- Skader andre spilleres oplevelse
- Ignorerer server lore eller realisme

**Scenario 2:** [Yderligere problematisk adfærd]
- Power gaming eller meta gaming
- Toxic adfærd over for community

## **⚖️ Konsekvenser ved Overtrædelse**

### **Første Overtrædelse**
- **Verbal Advarsel** fra staff medlem
- **Educational Samtale** om korrekt roleplay
- **Chance for at rette adfærd**

### **Gentagne Overtrædelser**
- **Skriftlig Advarsel** med dokumentation
- **Midlertidigt Ban** (1-7 dage)
- **Karakterbegrænsninger** eller restrictions

### **Alvorlige/Gentagne Brud**
- **Permanent Ban** fra serveren
- **Discord Ban** fra community
- **Blacklist** fra fremtidige ansøgninger

## **🔧 Hvordan Undgår Jeg Problemer?**

### **Best Practices**
1. **Læs alle regler grundigt** før du starter
2. **Spørg staff ved tvivl** - de hjælper gerne!  
3. **Observer erfarne spillere** og lær fra deres RP
4. **Tag feedback til efterretning** og forbedre dig

### **Når i tvivl:**
- Stop og tænk: "Ville dette ske i virkeligheden?"
- Overvej: "Gør dette gameplayet bedre for alle?"
- Spørg: "Passer dette til min karakters personlighed?"

---
**💬 Har du spørgsmål til denne regel? Kontakt staff via Discord eller in-game admin system!**

*Adventure RP - Hvor reglerne sikrer den bedste RP-oplevelse for alle! 🎭✨*`
    };

    return templates[type as keyof typeof templates] || 
      `# **${prompt} - Adventure RP Content**\n\nDette er professionelt indhold omkring **${prompt}** til Adventure RP serveren.\n\n**Professional, engaging content vil blive genereret her baseret på din prompt.**\n\nTilret for ${type} format med fokus på kvalitet og relevans for din FiveM roleplay server.`;
  };

  const generateFallbackContent = (type: string, prompt: string): string => {
    const templates = {
      story: `📖 **Roleplay Historie: ${prompt}**

Dette er en spændende historie i Adventure RP's cyberpunk verden, hvor ${prompt.toLowerCase()} spiller en central rolle. 

**Baggrund:**
I Neo-Copenhagens neonbelyste gader, hvor teknologi og kriminalitet mødes, udspiller sig en historie om ${prompt.toLowerCase()}. Her skal karaktererne navigere i en verden fuld af muligheder og farer.

**Handlingen:**
Vores historie begynder når ${prompt.toLowerCase()} bliver opdaget af de forkerte mennesker. Nu må protagonisten træffe svære valg der vil påvirke hele samfundet.

**Konklusion:**
I Adventure RP kan enhver historie blive til virkelighed - det er kun fantasien der sætter grænser.`,

      description: `🎮 **${prompt} - Adventure RP**

Oplev ${prompt.toLowerCase()} i vores cyberpunk-inspirerede FiveM server. Adventure RP tilbyder en unik roleplaying-oplevelse hvor enhver historie kan udfolde sig.

**Hvad vi tilbyder:**
• Professionel staff 24/7
• Custom scripts og indhold  
• Aktiv community på +200 spillere
• Realistisk økonomi og job-system
• Omfattende karakter-udvikling

**${prompt} Features:**
Her kan du opleve ${prompt.toLowerCase()} på en helt ny måde med vores specialdesignede systemer og scripts.

Kom og vær en del af Adventure RP - hvor din historia tæller!`,

      announcement: `📢 **Vigtig Meddelelse: ${prompt}**

Kære Adventure RP Community,

Vi vil gerne informere jer om ${prompt.toLowerCase()}. Dette er vigtigt for alle spillere at være opmærksomme på.

**Detaljer:**
${prompt} vil påvirke serveren på følgende måder:
• Forbedret gameplay-oplevelse
• Nye muligheder for roleplay
• Øget server-stabilitet

**Hvad skal I gøre:**
Sørg for at læse denne meddelelse grundigt og følg eventuelle instruktioner.

Tak for jeres forståelse og fortsæt den fantastiske roleplay!

- Adventure RP Staff Team`,

      rules: `📋 **Regel Forklaring: ${prompt}**

**Regel:** ${prompt}

**Formål:**
Denne regel eksisterer for at sikre en fair og sjov oplevelse for alle spillere på Adventure RP.

**Hvad betyder det:**
${prompt.toLowerCase()} refererer til følgende adfærd og handlinger som enten er påkrævet eller forbudt på serveren.

**Eksempler:**
• ✅ Korrekt: Følg regelens ånd og bogstav
• ❌ Forkert: Bryd ikke denne regel

**Konsekvenser:**
Overtrædelse af denne regel kan resultere i:
• Advarsel
• Midlertidigt ban
• Permanent ban (ved gentagne overtrædelser)

Har du spørgsmål? Kontakt staff via vores Discord eller in-game admin system.`
    };

    return templates[type as keyof typeof templates] || `Indhold om: ${prompt}`;
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: t('common.error'),
        description: t('creative.error_no_prompt'),
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const stylePrompt = {
        realistic: 'photorealistic, high detail, professional',
        artistic: 'artistic, painterly, creative',
        cartoon: 'cartoon style, animated, colorful',
        cyberpunk: 'cyberpunk, neon, futuristic, dark'
      }[imageStyle];

      const fullPrompt = `${imagePrompt}, ${stylePrompt}, high quality`;
      
      // Try to use edge function, fallback to placeholder if unavailable
      try {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: {
            prompt: fullPrompt,
            size: imageSize,
            style: imageStyle
          }
        });

        if (error) throw error;

        if (data?.image) {
          setGeneratedImageUrl(data.image);
          toast({
            title: t('common.success'),
            description: t('creative.success_image_generated')
          });
          return;
        }
      } catch (edgeFunctionError) {
        console.log('Edge function unavailable, using placeholder');
      }

      // Fallback: Generate a placeholder image using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const [width, height] = imageSize.split('x').map(Number);
      
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // Create gradient background based on style
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        
        switch (imageStyle) {
          case 'cyberpunk':
            gradient.addColorStop(0, '#ff006e');
            gradient.addColorStop(0.5, '#8338ec');
            gradient.addColorStop(1, '#3a86ff');
            break;
          case 'artistic':
            gradient.addColorStop(0, '#ff9a00');
            gradient.addColorStop(1, '#ff0080');
            break;
          case 'cartoon':
            gradient.addColorStop(0, '#00f5ff');
            gradient.addColorStop(1, '#ffa500');
            break;
          default:
            gradient.addColorStop(0, '#4a90e2');
            gradient.addColorStop(1, '#7b68ee');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.floor(width/20)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Wrap text if too long
        const maxWidth = width - 40;
        const lines = wrapText(ctx, imagePrompt, maxWidth);
        const lineHeight = Math.floor(width/15);
        const startY = height/2 - (lines.length * lineHeight) / 2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, width/2, startY + index * lineHeight);
        });

        setGeneratedImageUrl(canvas.toDataURL());
        toast({
          title: t('common.info'),
          description: 'AI service ikke tilgængelig - viser placeholder billede',
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: t('common.error'),
        description: t('creative.error_generation_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const createBanner = () => {
    if (!bannerText.trim()) {
      toast({
        title: t('common.error'),
        description: t('creative.error_no_text'),
        variant: 'destructive'
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 400;

    // Create gradient background based on style
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    switch (bannerStyle) {
      case 'gaming':
        gradient.addColorStop(0, bannerColor);
        gradient.addColorStop(1, '#1a1a2e');
        break;
      case 'minimal':
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9fa');
        break;
      case 'neon':
        gradient.addColorStop(0, '#ff006e');
        gradient.addColorStop(0.5, '#8338ec');
        gradient.addColorStop(1, '#3a86ff');
        break;
      case 'retro':
        gradient.addColorStop(0, '#ff9a00');
        gradient.addColorStop(1, '#ff0080');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add text
    ctx.fillStyle = bannerStyle === 'minimal' ? '#000000' : '#ffffff';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(bannerText, canvas.width / 2, canvas.height / 2);

    toast({
      title: t('common.success'),
      description: t('creative.success_banner_created')
    });
  };

  const downloadBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `banner-${bannerText.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.success'),
      description: t('creative.copy_to_clipboard')
    });
  };

  const copyBannerHTML = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    const html = `<img src="${dataURL}" alt="${bannerText}" style="width: 100%; max-width: 1200px; height: auto;" />`;
    copyToClipboard(html);
  };

  const ToolCard = ({ icon: Icon, title, description, toolKey, comingSoon = false }: {
    icon: any;
    title: string;
    description: string;
    toolKey: string;
    comingSoon?: boolean;
  }) => (
    <Card 
      className={`p-6 bg-gaming-card border-gaming-border transition-all duration-300 cursor-pointer
                 ${comingSoon ? 'opacity-50' : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20'}`}
      onClick={() => !comingSoon && setSelectedTool(toolKey)}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-full bg-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {comingSoon && (
            <Badge variant="secondary" className="mt-2">{t('creative.coming_soon')}</Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('creative.creative_tools')}</h2>
          <p className="text-muted-foreground">{t('creative.tools_description')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">{t('creative.ai_powered')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard
          icon={FileText}
          title={t('creative.ai_content_generator')}
          description={t('creative.ai_content_description')}
          toolKey="content"
        />
        <ToolCard
          icon={Image}
          title={t('creative.ai_image_generator')}
          description={t('creative.ai_image_description')}
          toolKey="image"
        />
        <ToolCard
          icon={Brush}
          title={t('creative.banner_creator')}
          description={t('creative.banner_description')}
          toolKey="banner"
        />
        <ToolCard
          icon={Type}
          title={t('creative.logo_designer')}
          description={t('creative.logo_description')}
          toolKey="logo"
          comingSoon
        />
        <ToolCard
          icon={Video}
          title={t('creative.video_editor')}
          description={t('creative.video_description')}
          toolKey="video"
          comingSoon
        />
        <ToolCard
          icon={Music}
          title={t('creative.audio_mixer')}
          description={t('creative.audio_description')}
          toolKey="audio"
          comingSoon
        />
      </div>

      {/* AI Content Generator Dialog */}
      <Dialog open={selectedTool === 'content'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('creative.ai_content_generator')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('creative.content_type')}</Label>
                <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">{t('creative.story')}</SelectItem>
                    <SelectItem value="description">{t('creative.description')}</SelectItem>
                    <SelectItem value="announcement">{t('creative.announcement')}</SelectItem>
                    <SelectItem value="rules">{t('creative.rules')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse / Prompt</Label>
              <Textarea
                value={contentPrompt}
                onChange={(e) => setContentPrompt(e.target.value)}
                placeholder={t('creative.prompt_placeholder')}
                rows={4}
              />
            </div>

            <Button 
              onClick={generateAIContent} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  {t('creative.generating')}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t('creative.generate_content')}
                </>
              )}
            </Button>

            {generatedContent && (
              <Card className="p-4 bg-gaming-dark border-gaming-border">
                <div className="flex items-center justify-between mb-2">
                  <Label>{t('creative.generated_content')}</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(generatedContent)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Kopier
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{generatedContent}</p>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Image Generator Dialog */}
      <Dialog open={selectedTool === 'image'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5" />
              <span>{t('creative.ai_image_generator')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Billede Beskrivelse</Label>
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder={t('creative.image_prompt_placeholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('creative.style')}</Label>
                <Select value={imageStyle} onValueChange={(value: any) => setImageStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">{t('creative.realistic')}</SelectItem>
                    <SelectItem value="artistic">{t('creative.artistic')}</SelectItem>
                    <SelectItem value="cartoon">{t('creative.cartoon')}</SelectItem>
                    <SelectItem value="cyberpunk">{t('creative.cyberpunk')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('creative.size')}</Label>
                <Select value={imageSize} onValueChange={(value: any) => setImageSize(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512x512">512x512 (Kvadrat)</SelectItem>
                    <SelectItem value="1024x1024">1024x1024 (Stor)</SelectItem>
                    <SelectItem value="1920x1080">1920x1080 (Banner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateImage} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Genererer Billede...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  {t('creative.generate_image')}
                </>
              )}
            </Button>

            {generatedImageUrl && (
              <Card className="p-4 bg-gaming-dark border-gaming-border">
                <div className="space-y-4">
                  <Label>Genereret Billede</Label>
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated" 
                    className="w-full rounded-lg border border-gaming-border"
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImageUrl;
                        link.download = 'generated-image.png';
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Creator Dialog */}
      <Dialog open={selectedTool === 'banner'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Brush className="h-5 w-5" />
              <span>{t('creative.banner_creator')}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Banner Tekst</Label>
              <Input
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder={t('creative.banner_text_placeholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('creative.style')}</Label>
                <Select value={bannerStyle} onValueChange={(value: any) => setBannerStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaming">{t('creative.gaming')}</SelectItem>
                    <SelectItem value="minimal">{t('creative.minimal')}</SelectItem>
                    <SelectItem value="neon">{t('creative.neon')}</SelectItem>
                    <SelectItem value="retro">{t('creative.retro')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('creative.primary_color')}</Label>
                <Input
                  type="color"
                  value={bannerColor}
                  onChange={(e) => setBannerColor(e.target.value)}
                />
              </div>
            </div>

            <div className="border-2 border-dashed border-gaming-border rounded-lg p-8 text-center">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gaming-border rounded"
                style={{ display: bannerText ? 'block' : 'none', margin: '0 auto' }}
              />
              {bannerText && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{t('creative.preview')}</p>
                </div>
              )}
              {!bannerText && (
                <div 
                  className="inline-block px-8 py-4 rounded-lg text-white font-bold text-xl"
                  style={{ backgroundColor: bannerColor }}
                >
                  {t('creative.your_banner_text')}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={createBanner} className="flex-1">
                <Brush className="h-4 w-4 mr-2" />
                {t('creative.create_banner')}
              </Button>
            </div>

            {bannerText && (
              <div className="flex space-x-2">
                <Button onClick={downloadBanner} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {t('creative.download_banner')}
                </Button>
                <Button variant="outline" onClick={copyBannerHTML}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('creative.copy_html')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Projects */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t('creative.recent_projects')}</h3>
          <Button variant="outline" size="sm">
            {t('creative.see_all')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 1, title: 'Server Regel Forklaring', type: 'content', hours: 2 },
            { id: 2, title: 'Cyberpunk Banner', type: 'banner', hours: 5 },
            { id: 3, title: 'Karakter Historie', type: 'content', hours: 8 }
          ].map((project) => (
            <Card key={project.id} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded bg-primary/20">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{project.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Oprettet for {project.hours} timer siden
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CreativeTools;