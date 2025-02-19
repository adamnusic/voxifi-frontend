import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Account, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
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
        await mintNFT(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange(true);

      toast({
        title: "Recording started",
        description: "Speak now to create your voice NFT"
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
        description: "Processing your voice NFT..."
      });
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
      const account = Account.generate();
      console.log('Account created:', account.accountAddress.toString());

      try {
        // Get test tokens from faucet
        toast({
          title: "Preparing NFT Mint",
          description: "Requesting test tokens..."
        });

        const faucetUrl = "https://faucet.testnet.aptoslabs.com/v1/fund";
        const fundResponse = await fetch(`${faucetUrl}?address=${account.accountAddress.toString()}&amount=100000000`);

        if (!fundResponse.ok) {
          throw new Error('Failed to fund account with test tokens');
        }

        toast({
          title: "Account Funded",
          description: "Creating your voice NFT..."
        });

        // Build transaction payload
        const payload = {
          function: "0x4::collection::create_collection_script",
          type_arguments: [],
          arguments: [
            "VoicePrint",
            "Audio NFT Collection",
            "https://voiceprint.example.com",
            "unlimited",
            [true, true, true] // Mutable: description, uri, token_properties
          ]
        };

        toast({
          title: "NFT Creation",
          description: "Building transaction..."
        });

        try {
          // Create transaction
          console.log('Creating transaction with payload:', payload);
          const transaction = await aptos.transaction.build({
            sender: account.accountAddress,
            payload: payload
          });

          console.log('Transaction built successfully:', transaction);

          // Sign transaction
          console.log('Signing transaction...');
          const signedTx = await aptos.transaction.sign({
            signer: account,
            transaction
          });

          console.log('Transaction signed successfully');

          toast({
            title: "NFT Minting",
            description: "Submitting to blockchain..."
          });

          // Submit transaction
          console.log('Submitting transaction...');
          const submittedTx = await aptos.transaction.submit({
            transaction: signedTx
          });

          console.log('Transaction submitted:', submittedTx);

          // Wait for transaction
          console.log('Waiting for transaction confirmation...');
          const txnResult = await aptos.waitForTransaction({
            transactionHash: submittedTx.hash
          });

          console.log('Transaction confirmed:', txnResult);

          toast({
            title: "Success!",
            description: `NFT minted! Transaction: ${txnResult.hash.slice(0, 10)}...`
          });
        } catch (error) {
          console.error('Aptos transaction error:', error);
          throw error;
        }

      } catch (txError) {
        console.error('Transaction failed:', txError);
        toast({
          variant: "destructive",
          title: "Minting Failed",
          description: "Could not mint NFT on Aptos blockchain. Check console for details."
        });
        throw new Error('Failed to mint NFT: Transaction error');
      }

      setIsMinting(false);
    } catch (error) {
      console.error('Error minting NFT:', error);
      setIsMinting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process voice NFT. Check console for details."
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
          {isMinting ? 'Minting...' : 'Mint Voice NFT'}
        </>
      )}
    </Button>
  );
}