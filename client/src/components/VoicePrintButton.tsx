import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoicePrintButtonProps {
  onRecordingChange: (isRecording: boolean) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export function VoicePrintButton({ onRecordingChange }: VoicePrintButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await mockMintNFT(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange(true);

      toast({
        title: "Recording started",
        description: "Speak now to create your Voiceprint NFT"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      onRecordingChange(false);
      toast({
        title: "Recording stopped",
        description: "Processing your Voiceprint NFT..."
      });
    }
  };

  const mockMintNFT = async (audioBlob: Blob) => {
    try {
      setIsMinting(true);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Creating Voiceprint NFT",
        description: "Generating unique audio signature..."
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Success!",
        description: "Your Voiceprint NFT has been created! ID: VP-" + Math.random().toString(36).substr(2, 9)
      });

      setIsMinting(false);
    } catch (error) {
      console.error('Error creating Voiceprint NFT:', error);
      setIsMinting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create Voiceprint NFT. Please try again."
      });
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={isMinting}
      className="fixed bottom-4 right-4 gap-2"
      variant={isRecording ? "destructive" : "default"}
    >
      {isRecording ? (
        <>
          <Square className="h-4 w-4" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          {isMinting ? 'Creating...' : 'Mint Voiceprint NFT'}
        </>
      )}
    </Button>
  );
}