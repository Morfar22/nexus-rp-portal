import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff, 
  Settings,
  Headphones,
  Waves
} from "lucide-react";

interface VoiceSettings {
  enabled: boolean;
  voice_model: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  auto_transcription: boolean;
  noise_suppression: boolean;
  echo_cancellation: boolean;
  volume: number;
}

interface ChatSession {
  id: string;
  visitor_name: string;
  status: string;
}

export const VoiceChatInterface = ({ selectedSession }: { selectedSession: ChatSession | null }) => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: false,
    voice_model: 'alloy',
    auto_transcription: true,
    noise_suppression: true,
    echo_cancellation: true,
    volume: 0.8
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadVoiceSettings();
    return () => {
      disconnectVoiceChat();
    };
  }, []);

  const loadVoiceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'voice_chat_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setVoiceSettings(data.setting_value as unknown as VoiceSettings);
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  };

  const saveVoiceSettings = async () => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'voice_chat_settings',
          setting_value: voiceSettings as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "Voice Settings Saved",
        description: "Voice chat settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast({
        title: "Error",
        description: "Failed to save voice settings",
        variant: "destructive"
      });
    }
  };

  const connectVoiceChat = async () => {
    if (!selectedSession) {
      toast({
        title: "No Session Selected",
        description: "Please select a chat session first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsConnected(true);
      
      // Initialize audio context
      const context = new AudioContext();
      setAudioContext(context);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: voiceSettings.echo_cancellation,
          noiseSuppression: voiceSettings.noise_suppression,
          autoGainControl: true
        }
      });

      // Connect to voice chat edge function
      const projectRef = 'vqvluqwadoaerghwyohk'; // Your project ref
      const ws = new WebSocket(`wss://${projectRef}.functions.supabase.co/functions/v1/realtime-voice-chat`);
      
      ws.onopen = () => {
        console.log('Voice chat connected');
        setIsConnected(true);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: voiceSettings.voice_model,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: voiceSettings.auto_transcription ? {
              model: 'whisper-1'
            } : null,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8
          }
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'response.audio.delta':
            await playAudioChunk(data.delta);
            setIsSpeaking(true);
            break;
            
          case 'response.audio.done':
            setIsSpeaking(false);
            break;
            
          case 'conversation.item.input_audio_transcription.completed':
            setTranscript(data.transcript);
            // Send transcript to chat
            if (data.transcript) {
              await sendTranscriptToChat(data.transcript);
            }
            break;
            
          case 'input_audio_buffer.speech_started':
            setIsListening(true);
            break;
            
          case 'input_audio_buffer.speech_stopped':
            setIsListening(false);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('Voice chat error:', error);
        toast({
          title: "Voice Chat Error",
          description: "Failed to connect to voice chat service.",
          variant: "destructive"
        });
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Voice chat disconnected');
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
      };

      setWsConnection(ws);
      
      // Start audio streaming
      startAudioStreaming(stream, ws);
      
      toast({
        title: "Voice Chat Connected",
        description: "Voice chat is now active for this session.",
      });
      
    } catch (error) {
      console.error('Error connecting voice chat:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to voice chat. Please check microphone permissions.",
        variant: "destructive"
      });
      setIsConnected(false);
    }
  };

  const disconnectVoiceChat = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
    
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setTranscript('');
  };

  const startAudioStreaming = (stream: MediaStream, ws: WebSocket) => {
    if (!audioContext) return;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN && !isMuted) {
        const inputData = e.inputBuffer.getChannelData(0);
        const audioData = encodeAudioForAPI(new Float32Array(inputData));
        
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: audioData
        }));
      }
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const encodeAudioForAPI = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContext) return;

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const wavData = createWavFromPCM(bytes);
      const audioBuffer = await audioContext.decodeAudioData(wavData.buffer);
      
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      gainNode.gain.value = voiceSettings.volume;
      source.buffer = audioBuffer;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const createWavFromPCM = (pcmData: Uint8Array) => {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  };

  const sendTranscriptToChat = async (transcriptText: string) => {
    if (!selectedSession) return;

    try {
      const currentUserId = localStorage.getItem('currentUserId') || '5027696b-aa78-4d31-84c6-a94ee5940f5f';
      
      await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          message: `🎤 ${transcriptText}`,
          sender_type: 'staff',
          sender_id: currentUserId
        });
    } catch (error) {
      console.error('Error sending transcript to chat:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="space-y-4">
      {/* Voice Chat Status */}
      <Card className="p-4 bg-gaming-darker border-gaming-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Headphones className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">Voice Chat</h3>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {isListening && (
              <Badge variant="outline" className="text-green-500">
                <Waves className="h-3 w-3 mr-1 animate-pulse" />
                Listening
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="outline" className="text-blue-500">
                <Volume2 className="h-3 w-3 mr-1 animate-pulse" />
                Speaking
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isConnected ? (
            <Button 
              onClick={connectVoiceChat}
              disabled={!selectedSession}
              className="bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Voice Chat
            </Button>
          ) : (
            <>
              <Button 
                onClick={disconnectVoiceChat}
                variant="destructive"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
              
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>

        {transcript && (
          <div className="mt-4 p-3 bg-gaming-card border border-gaming-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Last Transcript:</p>
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
        )}
      </Card>

      {/* Voice Settings */}
      <Card className="p-4 bg-gaming-darker border-gaming-border">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-4 w-4 text-gray-500" />
          <h4 className="font-medium text-foreground">Voice Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Voice Chat</Label>
              <p className="text-xs text-muted-foreground">Allow voice communication</p>
            </div>
            <Switch
              checked={voiceSettings.enabled}
              onCheckedChange={(checked) => 
                setVoiceSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto Transcription</Label>
              <p className="text-xs text-muted-foreground">Convert speech to text automatically</p>
            </div>
            <Switch
              checked={voiceSettings.auto_transcription}
              onCheckedChange={(checked) => 
                setVoiceSettings(prev => ({ ...prev, auto_transcription: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Noise Suppression</Label>
              <p className="text-xs text-muted-foreground">Reduce background noise</p>
            </div>
            <Switch
              checked={voiceSettings.noise_suppression}
              onCheckedChange={(checked) => 
                setVoiceSettings(prev => ({ ...prev, noise_suppression: checked }))
              }
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Volume: {Math.round(voiceSettings.volume * 100)}%</Label>
            <Slider
              value={[voiceSettings.volume]}
              onValueChange={([value]) => 
                setVoiceSettings(prev => ({ ...prev, volume: value }))
              }
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <Button onClick={saveVoiceSettings} className="w-full">
            Save Voice Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};