import { useEffect, useRef } from 'react';
import { setupScene } from '@/lib/scene';
import { setupAudio } from '@/lib/audio';

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ cleanup: () => void }>();
  const audioRef = useRef<{ cleanup: () => void }>();

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        // Initialize Three.js scene
        const scene = await setupScene(containerRef.current!);
        sceneRef.current = scene;

        // Initialize audio processing
        const audio = await setupAudio((audioData: Float32Array) => {
          // Pass audio data to scene for visualization
          scene.updateVisualization(audioData);
        });
        audioRef.current = audio;

      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();

    return () => {
      sceneRef.current?.cleanup();
      audioRef.current?.cleanup();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-background"
      style={{ touchAction: 'none' }}
    />
  );
}
