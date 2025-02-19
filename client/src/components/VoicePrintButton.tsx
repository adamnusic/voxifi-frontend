import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadUserRecording } from "@/services/storage/userRecordings.storage";
import { createUserRecording } from "@/services/db/userRecordings.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [nftId, setNftId] = useState<string>("");
  const [showTtsDialog, setShowTtsDialog] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [isProcessingTts, setIsProcessingTts] = useState(false);
  const { toast } = useToast();
  const [docId, setDocId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");

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

        // Show TTS dialog after recording is complete
        setShowTtsDialog(true);
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

  const handleTtsSubmit = async () => {
    if (!ttsText.trim() || !audioUrl) return;

    try {
      setIsProcessingTts(true);
      const ttsAudioUrl = await getTtsAudioUrl(ttsText, audioUrl);

      // Update audio player with new TTS audio
      if (audioPlayer) {
        audioPlayer.pause();
      }
      audioPlayer = new Audio(ttsAudioUrl);
      audioPlayer.onended = () => setIsPlaying(false);
      setIsAudioReady(true);
      setShowTtsDialog(false);

      toast({
        title: "Success",
        description: "TTS audio generated successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("TTS error:", error);
      toast({
        variant: "destructive",
        title: "TTS Error",
        description: "Failed to generate TTS audio",
        duration: 4000,
      });
    } finally {
      setIsProcessingTts(false);
    }
  };

  const mockMintNFT = async (audioBlob: Blob, docId: string) => {
    try {
      setIsMinting(true);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Creating Voiceprint NFT",
        description: "Generating unique audio signature...",
        duration: 2000,
      });

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const generatedId = docId;
      setNftId(generatedId);

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

      <Dialog open={showTtsDialog} onOpenChange={setShowTtsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate TTS Audio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter text to convert to speech..."
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              disabled={isProcessingTts}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleTtsSubmit}
              disabled={!ttsText.trim() || isProcessingTts}
            >
              {isProcessingTts ? "Processing..." : "Generate TTS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}