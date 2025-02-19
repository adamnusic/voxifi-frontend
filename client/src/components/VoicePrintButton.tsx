import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { Mic, Square } from 'lucide-react';

interface VoicePrintButtonProps {
  onRecordingChange: (isRecording: boolean) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export function VoicePrintButton({ onRecordingChange }: VoicePrintButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

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
        await mintNFT(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  const mintNFT = async (audioBlob: Blob) => {
    try {
      setIsMinting(true);

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      // Initialize Aptos SDK
      const config = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(config);

      // Create a new account or get existing one
      // Note: In a real app, you'd want to integrate with a wallet
      const account = Account.generate();

      // TODO: Replace with actual collection and token creation
      // This is a placeholder for the NFT minting transaction
      const transaction = await aptos.transaction.build.simple({
        sender: account.address,
        data: {
          function: "0x1::aptos_token::create_token_script",
          typeArguments: [],
          functionArguments: [
            "VoicePrint", // Collection name
            "Voice NFT", // Token name
            "A unique audio fingerprint", // Description
            1, // Supply: 1 for NFT
            base64Data, // URI: using base64 audio data
          ],
        },
      });

      console.log('NFT minted successfully!');
      setIsMinting(false);
    } catch (error) {
      console.error('Error minting NFT:', error);
      setIsMinting(false);
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
          {isMinting ? 'Minting...' : 'Mint Voice NFT'}
        </>
      )}
    </Button>
  );
}