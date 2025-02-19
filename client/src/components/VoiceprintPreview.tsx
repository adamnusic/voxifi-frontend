import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface VoiceprintPreviewProps {
  audioBlob: Blob | null;
  isOpen: boolean;
  onClose: () => void;
  nftId: string;
}

export function VoiceprintPreview({ audioBlob, isOpen, onClose, nftId }: VoiceprintPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const sourceNodeRef = useRef<MediaElementAudioSourceNode>();
  const analyzerRef = useRef<AnalyserNode>();
  const { toast } = useToast();

  const cleanup = () => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }

      if (analyzerRef.current) {
        analyzerRef.current.disconnect();
      }

      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }

      audioContextRef.current = undefined;
      sourceNodeRef.current = undefined;
      analyzerRef.current = undefined;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  useEffect(() => {
    if (!audioBlob || !isOpen || !canvasRef.current) return;

    let audioUrl: string | undefined;

    const setupAudio = async () => {
      try {
        audioUrl = URL.createObjectURL(audioBlob);

        // Create and setup audio element
        const audio = new Audio();
        audio.src = audioUrl;
        audioRef.current = audio;

        // Create audio context and nodes
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 2048;
        analyzerRef.current = analyzer;

        // Create source node and connect it
        const source = audioContext.createMediaElementSource(audio);
        sourceNodeRef.current = source;

        // Connect nodes: source -> analyzer -> destination
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);

        // Setup audio event handlers
        audio.onended = () => {
          setIsPlaying(false);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };

        console.log('Audio setup complete');
      } catch (error) {
        console.error('Audio setup error:', error);
        toast({
          variant: "destructive",
          title: "Setup Error",
          description: "Failed to setup audio preview",
        });
        cleanup();
      }
    };

    setupAudio();

    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioBlob, isOpen]);

  const drawVisualization = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);
      const timeData = new Uint8Array(analyzerRef.current.frequencyBinCount);

      analyzerRef.current.getByteFrequencyData(frequencyData);
      analyzerRef.current.getByteTimeDomainData(timeData);

      // Clear canvas
      ctx.fillStyle = 'rgb(23, 23, 23)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / frequencyData.length;
      const heightScale = canvas.height / 255;

      ctx.fillStyle = 'rgb(147, 51, 234)'; // Purple color
      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = frequencyData[i] * heightScale;
        ctx.fillRect(
          i * barWidth,
          canvas.height - barHeight,
          barWidth - 1,
          barHeight
        );
      }

      // Draw waveform overlay
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;

      const sliceWidth = canvas.width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(drawVisualization);
      }
    } catch (error) {
      console.error('Visualization error:', error);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current) {
      console.error('No audio element available');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        drawVisualization();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: "Failed to play audio",
      });
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          if (isPlaying) togglePlayback();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Voiceprint NFT Preview - {nftId}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <canvas 
            ref={canvasRef}
            width={640}
            height={200}
            className="w-full rounded-lg bg-background border"
          />

          <div className="mt-4 flex justify-center">
            <Button
              onClick={togglePlayback}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}