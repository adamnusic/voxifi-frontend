import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { setupAudioAnalyzer, type AudioData } from '@/lib/audio';
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
  const analyzerRef = useRef<{ getAudioData: () => AudioData } | null>(null);
  const { toast } = useToast();

  // Clean up function to handle all resource cleanup
  const cleanup = () => {
    try {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
        audioContextRef.current = undefined;
      }

      analyzerRef.current = null;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  useEffect(() => {
    if (!audioBlob || !isOpen || !canvasRef.current) return;

    let audioUrl: string;
    try {
      // Create audio element with blob URL
      audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Create AudioContext and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(new MediaStream());
      source.connect(audioContext.destination);

      // Set up audio analyzer
      setupAudioAnalyzer().then((analyzer) => {
        analyzerRef.current = analyzer;
        console.log('Audio analyzer setup complete');
      }).catch((error) => {
        console.error('Audio analyzer setup failed:', error);
        toast({
          variant: "destructive",
          title: "Visualization Error",
          description: "Failed to setup audio visualization",
        });
      });

      // Handle audio end
      audio.onended = () => {
        setIsPlaying(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      return () => {
        cleanup();
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Preview setup error:', error);
      toast({
        variant: "destructive",
        title: "Preview Error",
        description: "Failed to setup audio preview",
      });
      cleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    }
  }, [audioBlob, isOpen]);

  const drawVisualization = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const audioData = analyzerRef.current.getAudioData();

      // Clear canvas
      ctx.fillStyle = 'rgb(23, 23, 23)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / audioData.frequencies.length;
      const heightScale = canvas.height / 255;

      ctx.fillStyle = 'rgb(147, 51, 234)'; // Purple color
      for (let i = 0; i < audioData.frequencies.length; i++) {
        const barHeight = audioData.frequencies[i] * heightScale;
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

      const sliceWidth = canvas.width / audioData.waveform.length;
      let x = 0;

      for (let i = 0; i < audioData.waveform.length; i++) {
        const v = audioData.waveform[i] / 128.0;
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
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        // Resume audio context if it was suspended
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