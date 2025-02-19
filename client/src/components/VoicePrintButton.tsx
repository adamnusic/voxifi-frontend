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

      // Create a new account
      const account = new Account();

      try {
        // Build and submit the transaction
        const transaction = await aptos.transaction.build.simple({
          sender: account.accountAddress, // Use accountAddress instead of address
          data: {
            function: "0x1::aptos_token::create_collection_script",
            typeArguments: [],
            functionArguments: [
              "VoicePrint", // Collection name
              "Audio NFT Collection", // Description
              "https://voiceprint.example.com", // Collection URI
              "unlimited", // Maximum supply
              true, // Allow mutation
            ],
          },
        });

        // Sign and submit transaction
        const signedTxn = await aptos.transaction.sign({ signer: account, transaction });
        const pendingTxn = await aptos.transaction.submit.simple({ transaction: signedTxn });

        await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });
        console.log('NFT minted successfully! Transaction hash:', pendingTxn.hash);
      } catch (txError) {
        console.error('Transaction failed:', txError);
        throw new Error('Failed to mint NFT: Transaction error');
      }

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