import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { initScene, updateVisualization } from '@/lib/scene';
import { setupAudioAnalyzer } from '@/lib/audio';
import ErrorMessage from '@/components/ErrorMessage';
import { Card, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    visualization: THREE.Object3D;
  }>();
  const frameRef = useRef<number>();
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let analyzer: any = null;

    const init = async () => {
      try {
        setIsInitializing(true);
        setError('');

        // Check if browser supports WebXR
        if (!navigator.xr) {
          throw new Error('WebXR not supported in this browser. Please use a WebXR-compatible browser.');
        }

        // Initialize Three.js scene first
        sceneRef.current = await initScene(containerRef.current);

        // Then setup audio analyzer
        try {
          analyzer = await setupAudioAnalyzer();
        } catch (audioErr) {
          throw new Error('Please allow microphone access to experience the audio visualization.');
        }

        // Start animation loop once everything is ready
        const animate = () => {
          if (!sceneRef.current || !analyzer) return;

          const { scene, camera, renderer, visualization } = sceneRef.current;

          // Update visualization based on audio data
          const audioData = analyzer.getAudioData();
          updateVisualization(visualization, audioData);

          renderer.render(scene, camera);
          frameRef.current = requestAnimationFrame(animate);
        };

        animate();
        setIsInitializing(false);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setIsInitializing(false);
        console.error('Initialization error:', err);
      }
    };

    init();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (sceneRef.current?.renderer) {
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <Mic className="h-12 w-12 text-primary animate-pulse" />
              <h1 className="text-2xl font-bold">Initializing Visualizer</h1>
              <p className="text-sm text-muted-foreground">
                Please allow microphone access when prompted to experience the audio visualization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100vw', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
}