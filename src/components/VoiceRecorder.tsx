import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Square, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export default function VoiceRecorder({ onTranscription, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    if (isDisabled || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.current = recorder;
      recorder.start(1000); // Collect data every second

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60) { // Auto-stop after 60 seconds
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [isDisabled, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    }
  }, [isRecording]);

  const processRecording = async () => {
    if (audioChunks.current.length === 0) {
      toast({
        title: "No Audio",
        description: "No audio data was recorded",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix

        try {
          // Send to voice-to-text edge function
          const { data, error } = await supabase.functions.invoke('chat-voice-to-text', {
            body: {
              audio: base64Data,
              format: 'webm'
            }
          });

          if (error) throw error;

          if (data.success && data.text) {
            onTranscription(data.text);
            toast({
              title: "Voice Transcribed",
              description: `"${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
            });
          } else {
            throw new Error(data.error || 'Failed to transcribe audio');
          }
        } catch (error) {
          console.error('Error processing voice:', error);
          toast({
            title: "Transcription Error",
            description: "Failed to convert speech to text",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio recording",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          disabled={isDisabled || isProcessing}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-neon-teal"
          title="Record voice message"
        >
          <Mic className="h-4 w-4" />
        </Button>
      ) : (
        <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-500 font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <Button
            onClick={stopRecording}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400 h-6 w-6 p-0"
            title="Stop recording"
          >
            <Square className="h-3 w-3 fill-current" />
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-neon-teal border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}