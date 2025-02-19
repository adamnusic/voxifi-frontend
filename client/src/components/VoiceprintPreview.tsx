import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { setupAudioAnalyzer, type AudioData } from '@/lib/audio';

interface VoiceprintPreviewProps {
  audioBlob: Blob | null;
  isOpen: boolean;
  onClose: () => void;
  nftId: string;
}

export function VoiceprintPreview({ audioBlob, isOpen, onClose, nftId }: VoiceprintPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyzerRef = useRef<{ getAudioData: () => AudioData } | null>(null);

  useEffect(() => {
    if (!audioBlob || !isOpen) return;

    // Create audio element with blob URL
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Create AudioContext and analyzer
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    audioContextRef.current = audioContext;

    // Connect audio to context
    source.connect(audioContext.destination);

    // Set up audio analyzer
    setupAudioAnalyzer().then((analyzer) => {
      analyzerRef.current = analyzer;
    });

    audio.onended = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    return () => {
      URL.revokeObjectURL(audioUrl);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audio.pause();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, [audioBlob, isOpen]);

  const drawVisualization = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
  };

  const togglePlayback = async () => {
    if (!audioRef.current) return;

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (isPlaying) togglePlayback();
        onClose();
      }
    }}>
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