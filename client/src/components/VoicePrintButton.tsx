import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadUserRecording } from "@/services/storage/userRecordings.storage";
import { createUserRecording } from "@/services/db/userRecordings.service";
import axios from "axios";
import { getTtsAudioUrl } from "@/utils/helper";

interface VoicePrintButtonProps {
  onRecordingChange: (isRecording: boolean) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioPlayer: HTMLAudioElement | null = null;

export function VoicePrintButton({ onRecordingChange }: VoicePrintButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const { toast } = useToast();
  const [docId, setDocId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [mintTxUrl, setMintTxUrl] = useState<string>("");
  const [convertedAudioUrl, setConvertedAudioUrl] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setRecordedAudio(audioBlob);
        setIsAudioReady(false); // Reset audio ready state

        const docId = await createUserRecording();
        setDocId(docId);
        const audioUrl = await uploadUserRecording(audioBlob, `${docId}.mp3`);
        setAudioUrl(audioUrl);

        // Create audio player
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer = null;
        }
        audioPlayer = new Audio(URL.createObjectURL(audioBlob));
        audioPlayer.onended = () => setIsPlaying(false);

        // Set audio as ready only after all processing is complete
        await mockMintNFT(audioBlob, docId);
        setIsAudioReady(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingChange(true);

      toast({
        title: "Recording started",
        description: "Speak now to create your Voiceprint NFT",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone",
        duration: 4000,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      onRecordingChange(false);
      toast({
        title: "Recording stopped",
        description: "Processing your Voiceprint NFT...",
        duration: 2000,
      });
    }
  };

  const togglePlayback = async () => {
    if (!audioPlayer || !isAudioReady) return;

    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioPlayer.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback error:", error);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Failed to play audio",
          duration: 4000,
        });
      }
    }
  };

  const mockMintNFT = async (audioBlob: Blob, docId: string) => {
    try {
      setIsMinting(true);

      toast({
        title: "Creating Voiceprint NFT",
        description: "Generating unique audio signature...",
        duration: 2000,
      });
      // Simulate processing delay
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await axios.post(
        `${import.meta.env.VITE_AGENT_SERVER_URL}/mint-digital-asset-aptos`,
        {
          name: `Voiceprint NFT Sample - ${docId}`,
        },
      );
      const url = await response.data.url;
      setMintTxUrl(url);

      const generatedId = docId;

      toast({
        title: "Success!",
        description: "Your Voiceprint NFT has been created! ID: " + generatedId,
        duration: 4000,
      });

      setIsMinting(false);
    } catch (error) {
      console.error("Error creating Voiceprint NFT:", error);
      setIsMinting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create Voiceprint NFT. Please try again.",
        duration: 4000,
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
    <div className="fixed bottom-4 right-4 flex gap-2">
      <Button
        onClick={handleClick}
        disabled={isMinting}
        className="gap-2"
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
            {isMinting ? "Creating..." : "Mint Voiceprint NFT"}
          </>
        )}
      </Button>

      {recordedAudio && isAudioReady && !isRecording && (
        <Button
          onClick={togglePlayback}
          variant="outline"
          className="gap-2"
          disabled={isMinting}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Play
            </>
          )}
        </Button>
      )}
      {mintTxUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              Digital Asset Successfully Created!
            </h3>
            <p className="mb-4">
              Your Voiceprint NFT has been deployed to the blockchain.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={mintTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View NFT Transaction
              </a>
              <p className="mb-4">Copy your Audio ID: {docId}</p>
              {convertedAudioUrl ? (
                <audio src={convertedAudioUrl} controls />
              ) : (
                <div
                  onClick={async () => {
                    if (isConverting) return;
                    setIsConverting(true);
                    try {
                      const url = await getTtsAudioUrl(
                        "This hackathon is bringing out the fire in me",
                        audioUrl,
                      );

                      url && setConvertedAudioUrl(url);
                    } catch (e) {
                      alert(
                        "Currently the GPU is busy, please try again later",
                      );
                    } finally {
                      setIsConverting(false);
                    }
                  }}
                  className="text-lg font-medium"
                >
                  <span className="bg-blue-200 px-4 py-2 rounded hover:bg-blue-300 transition-colors inline-block w-full text-center">
                    {isConverting ? "Loading..." : "Create Fake Voice"}
                  </span>
                </div>
              )}
              <a
                href="https://voxifi-aptos-agent.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium"
              >
                <span className="bg-yellow-200 px-4 py-2 rounded hover:bg-yellow-300 transition-colors inline-block w-full text-center">
                  Create a Prediction Market Now! →
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
