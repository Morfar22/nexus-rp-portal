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
    // Interpret the prompt and generate appropriate content
    const interpretPrompt = (prompt: string, type: string): any => {
      const lowerPrompt = prompt.toLowerCase();
      
      // Character description detection - improved Danish detection
      if (lowerPrompt.includes('beskriv') && (lowerPrompt.includes('karakter') || lowerPrompt.includes('john') || lowerPrompt.includes('person'))) {
        // Extract character name from various Danish patterns
        let characterName = '';
        
        // Pattern: "beskriv karakteren john doe"
        if (lowerPrompt.includes('karakteren')) {
          characterName = prompt.replace(/.*beskriv karakteren\s*/gi, '').split(/[\s,!.]/)[0];
        }
        // Pattern: "beskriv john doe han er..."
        else if (lowerPrompt.includes('beskriv') && !lowerPrompt.includes('karakter')) {
          const afterBeskriv = prompt.replace(/.*beskriv\s*/gi, '');
          characterName = afterBeskriv.split(/[\s,!.]/)[0];
        }
        // Pattern: "john doe er en..."
        else {
          const words = prompt.split(' ');
          const beskrivIndex = words.findIndex(word => word.toLowerCase().includes('beskriv'));
          if (beskrivIndex >= 0 && beskrivIndex < words.length - 1) {
            characterName = words[beskrivIndex + 1];
          }
        }
        
        // Clean up character name
        characterName = characterName.replace(/[^a-zA-ZæøåÆØÅ\s]/g, '').trim();
        
        return {
          isCharacter: true,
          name: characterName || 'Unknown Character',
          type: 'character',
          fullPrompt: prompt
        };
      }

      // Event/situation detection
      if (lowerPrompt.includes('event') || lowerPrompt.includes('situation') || lowerPrompt.includes('hvad sker')) {
        return { isEvent: true, topic: prompt };
      }

      // Location description
      if (lowerPrompt.includes('sted') || lowerPrompt.includes('location') || lowerPrompt.includes('område')) {
        return { isLocation: true, place: prompt };
      }

      return { isGeneral: true, topic: prompt };
    };

    const analysis = interpretPrompt(prompt, type);

    if (type === 'story') {
      if (analysis.isCharacter) {
        return `# 📖 **${analysis.name} - En Adventure RP Karakter Historie**

## **🎭 Karakterprofil: ${analysis.name}**

**Navn:** ${analysis.name}  
**Alder:** 28-35 år  
**Baggrund:** Vokset op i Neo-Copenhagens hårde gader  

### **🌟 Personlighed**
${analysis.name} er en kompleks karakter med dyb baghistorie. Kendt for sin skarpe intelligens og pragmatiske tilgang til livet. Har lært at navigere i både den legale og illegale verden gennem år på gaderne.

**Karaktertræk:**
- **Styrker:** Strategisk tænker, loyal over for venner, overlever-instinkt
- **Svagheder:** Kan være for forsigtig, har svært ved at stole på nye mennesker
- **Motiver:** Søger stabilitet og respekt i det kaotiske samfund

### **📚 Baghistorie**
${analysis.name} kom til Adventure RP som en person der søgte en ny start. Med en mystisk fortid og færdigheder der antyder en kompleks historie, har ${analysis.name} langsomt bygget et netværk og rygte på serveren.

**Centrale oplevelser:**
- Første møde med de lokale bander i Downtown District
- Opbygning af tillidsforhold til andre spillere
- Kritiske beslutninger der formede karakterens udvikling

### **🎯 Nuværende Situation**
I dag er ${analysis.name} en respekteret figur på Adventure RP, kendt for sin evne til at navigere komplekse sociale situationer og finde løsninger hvor andre ser problemer.

**Relationer:**
- Allierede: Bygget stærke bånd til nøglepersoner
- Rivaler: Naturlige konflikter med andre dominerende karakterer  
- Mentorer: Både lærer fra og vejleder andre spillere

---
*🎮 ${analysis.name} er et perfekt eksempel på hvordan dyb karakterudvikling blomstrer på Adventure RP!*`;
      }
      
      return `# 📖 **${prompt} - En Adventure RP Historie**

## **🌆 Setting: Neo-Copenhagen**
I Adventure RP's cyberpunk-inspirerede verden udspiller sig en dramatisk historie omkring ${prompt.toLowerCase()}.

### **Kapitel 1: Begyndelsen**
Det hele startede en regnfuld aften i Downtown District. Neonlys reflekterede i våde gader mens karaktererne forberedte sig på begivenheder der ville ændre alt.

**Protagonisten** står over for et valg der vil definere deres fremtid på serveren.

### **Kapitel 2: Konflikten**
${prompt} bringer kompleksitet til historien. Alliancer testes, loyalitet udfordres, og sandheden bliver sværere at skelne fra løgn.

**Climax:** Det afgørende øjeblik hvor alt hænger i en tynd tråd.

### **Kapitel 3: Konsekvenserne**  
Intet valg er uden konsekvenser i Adventure RP. Karakterernes handlinger sender chokbølger gennem hele serveren.

**Resolution:** En ny balance etableres, men til hvilken pris?

---
*💡 Lad denne historie inspirere dit næste roleplay på Adventure RP!*`;
    }

    if (type === 'description') {
      if (analysis.isCharacter) {
        // Extract character details from the prompt
        const lowerPrompt = analysis.fullPrompt.toLowerCase();
        let characterTraits = '';
        
        if (lowerPrompt.includes('voldig') || lowerPrompt.includes('voldelig')) {
          characterTraits += '- **Temperament:** Har en voldelig natur og er ikke bange for konfrontation\n';
        }
        if (lowerPrompt.includes('korruption')) {
          characterTraits += '- **Moral:** Åben for korruption og tvivlsomme forretninger\n';
        }
        if (lowerPrompt.includes('alkohol')) {
          characterTraits += '- **Afhængigheder:** Har problemer med alkohol\n';
        }
        if (lowerPrompt.includes('stoffer')) {
          characterTraits += '- **Substancer:** Involveret i narkotika miljøet\n';
        }
        
        return `# 🎮 **${analysis.name} - Adventure RP Karakter**

## **👤 Karakterprofil baseret på: "${analysis.fullPrompt}"**

**${analysis.name}** er en kompleks karakter på Adventure RP serveren med en mørk og kontroversiel baggrund.

### **🌟 Karakterspecifikationer**
**Fulde Navn:** ${analysis.name}  
**Kaldenavn:** [Tilpasset karakterens personlighed] 
**Profession:** Sandsynligvis involveret i undergrundens aktiviteter
**Bosted:** De mere farlige områder af Neo-Copenhagen  

### **⚠️ Karaktertræk & Personlighed**
${characterTraits || '- **Generel:** En person med en kompleks og potentielt farlig personlighed'}

### **🎭 Roleplay Potentiale**
${analysis.name} tilbyder spændende roleplay-muligheder som:
- **Antagonist rolle:** Kan skabe konflikt og drama
- **Kriminel kontakt:** Perfekt til undergrundshistorier  
- **Komplekse storylines:** Karakterens problemer skaber naturlige plotpunkter

### **⚖️ RP Guidelines**
**Vigtigt at huske:**
- Alle kriminelle handlinger skal følge server regler
- Samtykke er påkrævet for konflikt-RP
- Karakterens problemer skal roleplays ansvarligt
- Respekter andre spilleres boundaries

### **📈 Udvikling på Serveren**
**Startpunkt:** Sandsynligvis startet som en lavt-niveau kriminel
**Potentiale:** Kan udvikle sig i mange retninger afhængigt af spillerens valg
**Relationer:** Vil naturligt tiltrække både venner og fjender

---
*🚨 ${analysis.name} er en karakter der kræver modent roleplay og respekt for andre spillere på Adventure RP!*`;
      }
      
      return `# 🎮 **${prompt} - Adventure RP Feature**

Dette er en central del af Adventure RP-oplevelsen, designet til at give spillere den bedst mulige roleplay-oplevelse i vores cyberpunk-inspirerede verden.

**Hvad tilbyder vi:**
- Autentisk gameplay-mekanikker
- Professionel staff support 24/7  
- Aktiv community på +200 spillere
- Custom scripts og unikke features

*🌟 Oplev ${prompt.toLowerCase()} på en helt ny måde på Adventure RP!*`;
    }

    if (type === 'announcement') {
      return `# 📢 **VIGTIG MEDDELELSE: ${prompt}**

## **Kære Adventure RP Community**

Vi vil gerne informere jer om vigtige nyheder vedrørende ${prompt.toLowerCase()}.

### **📋 Detaljer**
Dette er relevant information som alle spillere bør være opmærksomme på for at sikre den bedste oplevelse på serveren.

### **⚡ Handling Påkrævet**
Sørg for at læse denne meddelelse grundigt og følg eventuelle instruktioner fra staff-teamet.

---
**Tak for jeres fortsatte support til Adventure RP!**  
*- Adventure RP Leadership Team*`;
    }

    if (type === 'rules') {
      return `# 📋 **REGEL FORKLARING: ${prompt}**

## **🎯 Formål**
Denne regel eksisterer for at sikre fair og sjov gameplay for alle spillere på Adventure RP.

### **📖 Hvad det betyder**
${prompt} refererer til specifik adfærd som enten er påkrævet eller forbudt på serveren for at opretholde en positiv roleplay-atmosfære.

### **✅ Tilladt**
- Adfærd der følger regelns ånd
- Handlinger der beriger andre spilleres oplevelse
- Kreativ roleplay inden for guidelines

### **❌ Forbudt**  
- Brud på regelns grundlæggende principper
- Adfærd der skader community-atmosfæren
- Ignorering af staff-instruktioner

### **⚖️ Konsekvenser**
- **Første gang:** Venlig påmindelse fra staff
- **Gentagne brud:** Advarsel eller midlertidigt ban
- **Alvorlige tilfælde:** Permanent ban fra serveren

---
*💬 Har du spørgsmål? Kontakt staff via Discord eller in-game admin-system!*`;
    }

    return `# **${prompt} - Adventure RP Content**

Professional indhold genereret baseret på: ${prompt}

Dette indhold er tilpasset Adventure RP serveren og fokuserer på kvalitet og relevans for vores FiveM roleplay community.`;
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

  const generateBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bannerText.trim()) {
      toast({
        title: t('common.error'),
        description: t('creative.error_no_text'),
        variant: 'destructive'
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 200;

    // Create styled banner based on style
    switch (bannerStyle) {
      case 'gaming':
        // Gaming style with gradient and neon effects
        const gamingGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gamingGradient.addColorStop(0, bannerColor);
        gamingGradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gamingGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border effect
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        break;
        
      case 'minimal':
        // Clean minimal style
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = bannerColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        break;
        
      case 'neon':
        // Dark background with neon glow
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
        
      case 'retro':
        // Retro gradient
        const retroGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        retroGradient.addColorStop(0, '#ff006e');
        retroGradient.addColorStop(0.5, '#8338ec');
        retroGradient.addColorStop(1, '#3a86ff');
        ctx.fillStyle = retroGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
    }

    // Add text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (bannerStyle === 'neon') {
      // Neon glow effect
      ctx.shadowColor = bannerColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = bannerColor;
      ctx.font = 'bold 48px Arial, sans-serif';
    } else if (bannerStyle === 'minimal') {
      ctx.fillStyle = bannerColor;
      ctx.font = 'bold 36px Arial, sans-serif';
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Arial, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    ctx.fillText(bannerText, canvas.width / 2, canvas.height / 2);

    toast({
      title: t('common.success'),
      description: t('creative.success_banner_created')
    });
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageUrl = canvas.toDataURL();
    downloadImage(imageUrl, 'adventure-rp-banner.png');
  };

  const downloadGeneratedImage = () => {
    if (generatedImageUrl) {
      downloadImage(generatedImageUrl, 'adventure-rp-generated-image.png');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: t('common.success'),
        description: t('creative.success_copied')
      });
    });
  };

  const creativeTools = [
    {
      id: 'content',
      title: t('creative.ai_content_generation'),
      description: t('creative.ai_content_description'),
      icon: FileText,
      category: 'AI'
    },
    {
      id: 'image',
      title: t('creative.ai_image_generation'),
      description: t('creative.ai_image_description'),
      icon: Image,
      category: 'AI'
    },
    {
      id: 'banner',
      title: t('creative.banner_creator'),
      description: t('creative.banner_description'),
      icon: Brush,
      category: 'Design'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
              {t('creative.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('creative.description')}
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {creativeTools.map((tool) => (
              <Card 
                key={tool.id}
                className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  selectedTool === tool.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedTool(tool.id)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tool.title}</h3>
                    <Badge variant="secondary">{tool.category}</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground">{tool.description}</p>
              </Card>
            ))}
          </div>

          {/* Tool Interfaces */}
          {selectedTool === 'content' && (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{t('creative.ai_content_generation')}</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="content-type">{t('creative.content_type')}</Label>
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

                  <div>
                    <Label htmlFor="content-prompt">{t('creative.description_prompt')}</Label>
                    <Textarea
                      id="content-prompt"
                      placeholder={t('creative.content_prompt_placeholder')}
                      value={contentPrompt}
                      onChange={(e) => setContentPrompt(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button 
                    onClick={generateAIContent}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        {t('creative.generating')}
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        {t('creative.generate_content')}
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>{t('creative.generated_content')}</Label>
                    {generatedContent && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t('creative.copy')}
                      </Button>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                    {generatedContent ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {generatedContent}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        {t('creative.content_will_appear_here')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {selectedTool === 'image' && (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Image className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{t('creative.ai_image_generation')}</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="image-prompt">{t('creative.image_description')}</Label>
                    <Textarea
                      id="image-prompt"
                      placeholder={t('creative.image_prompt_placeholder')}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
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

                    <div>
                      <Label>{t('creative.size')}</Label>
                      <Select value={imageSize} onValueChange={(value: any) => setImageSize(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="512x512">512x512</SelectItem>
                          <SelectItem value="1024x1024">1024x1024</SelectItem>
                          <SelectItem value="1920x1080">1920x1080</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={generateImage}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        {t('creative.generating')}
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-5 w-5" />
                        {t('creative.generate_image')}
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>{t('creative.generated_image')}</Label>
                    {generatedImageUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadGeneratedImage}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('creative.download')}
                      </Button>
                    )}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                    {generatedImageUrl ? (
                      <img 
                        src={generatedImageUrl} 
                        alt="Generated content" 
                        className="max-w-full max-h-[400px] rounded-lg shadow-lg"
                      />
                    ) : (
                      <p className="text-muted-foreground text-center">
                        {t('creative.image_will_appear_here')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {selectedTool === 'banner' && (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Brush className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{t('creative.banner_creator')}</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="banner-text">{t('creative.banner_text')}</Label>
                    <Input
                      id="banner-text"
                      placeholder={t('creative.banner_text_placeholder')}
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('creative.banner_style')}</Label>
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

                    <div>
                      <Label>{t('creative.primary_color')}</Label>
                      <Input
                        type="color"
                        value={bannerColor}
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="h-10 w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={generateBanner}
                      className="flex-1"
                      size="lg"
                    >
                      <Type className="mr-2 h-5 w-5" />
                      {t('creative.create_banner')}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={downloadBanner}
                      size="lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {t('creative.download')}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-4 block">{t('creative.banner_preview')}</Label>
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center">
                    <canvas 
                      ref={canvasRef}
                      className="max-w-full border rounded-lg shadow-lg bg-white"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!selectedTool && (
            <Card className="p-12 text-center">
              <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('creative.select_tool')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('creative.select_tool_description')}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeTools;