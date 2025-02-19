import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const analyzerRef = useRef<AnalyserNode>();
  const { toast } = useToast();
  const hueRef = useRef(0);

  useEffect(() => {
    if (!audioBlob || !isOpen) return;

    // Create audio element and set source
    const audio = new Audio();
    const audioUrl = URL.createObjectURL(audioBlob);
    audio.src = audioUrl;
    audioRef.current = audio;

    // Handle audio end
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    });

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
    };
  }, [audioBlob, isOpen]);

  const setupAudioContext = async () => {
    if (!audioRef.current) return;

    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyzer if it doesn't exist
      if (!analyzerRef.current) {
        const analyzer = audioContextRef.current.createAnalyser();
        analyzer.fftSize = 2048;
        analyzer.smoothingTimeConstant = 0.85;
        analyzerRef.current = analyzer;

        // Connect audio element to analyzer and destination
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyzer);
        analyzer.connect(audioContextRef.current.destination);
      }
    } catch (error) {
      console.error('Audio setup error:', error);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Failed to setup audio playback",
      });
    }
  };

  const drawVisualization = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get frequency and time domain data
    const frequencyData = new Uint8Array(analyzerRef.current.frequencyBinCount);
    const timeData = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(frequencyData);
    analyzerRef.current.getByteTimeDomainData(timeData);

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frequency bars
    const barWidth = (canvas.width / frequencyData.length) * 2.5;
    const heightScale = canvas.height / 256;

    for (let i = 0; i < frequencyData.length / 2; i++) {
      const freq = frequencyData[i];
      const hue = (hueRef.current + (i / frequencyData.length) * 360) % 360;
      const saturation = 70 + (freq / 256) * 30;
      const lightness = 40 + (freq / 256) * 20;

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      // Calculate bar height with some minimum height
      const barHeight = Math.max(freq * heightScale, 2);

      // Draw mirrored bars
      const x1 = canvas.width / 2 + i * barWidth;
      const x2 = canvas.width / 2 - (i + 1) * barWidth;

      ctx.fillRect(x1, canvas.height - barHeight, barWidth - 1, barHeight);
      ctx.fillRect(x2, canvas.height - barHeight, barWidth - 1, barHeight);
    }

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${hueRef.current}, 80%, 60%, 0.8)`;
    ctx.lineWidth = 2;

    const sliceWidth = canvas.width / timeData.length;
    let x = 0;

    ctx.moveTo(0, canvas.height / 2);
    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Update hue for next frame
    hueRef.current = (hueRef.current + 1) % 360;

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(drawVisualization);
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Audio not available",
      });
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        await setupAudioContext();
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