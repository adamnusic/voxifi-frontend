import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { initScene, updateVisualization } from '@/lib/scene';
import { setupAudioAnalyzer } from '@/lib/audio';
import ErrorMessage from '@/components/ErrorMessage';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, RefreshCcw } from "lucide-react";

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group;
  }>();
  const frameRef = useRef<number>();
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsMicPermission, setNeedsMicPermission] = useState(false);

  const initAudio = async () => {
    try {
      setError('');
      setNeedsMicPermission(false);
      const analyzer = await setupAudioAnalyzer();
      return analyzer;
    } catch (err) {
      if (err instanceof Error && err.message.includes('denied')) {
        setNeedsMicPermission(true);
        throw new Error('Microphone access is required for audio visualization. Please grant permission and try again.');
      }
      throw err;
    }
  };

  const initializeVisualization = async () => {
    if (!containerRef.current) return;

    try {
      setIsInitializing(true);
      setError('');

      // Check WebXR support
      if (!navigator.xr) {
        throw new Error('WebXR not supported in this browser. Please use a WebXR-compatible browser.');
      }

      // Initialize Three.js scene
      sceneRef.current = initScene(containerRef.current);

      // Setup audio analyzer
      const analyzer = await initAudio();

      // Animation loop
      const animate = () => {
        if (!sceneRef.current || !analyzer) return;

        const audioData = analyzer.getAudioData();
        updateVisualization(sceneRef.current.group, audioData);

        sceneRef.current.renderer.render(
          sceneRef.current.scene,
          sceneRef.current.camera
        );
        frameRef.current = requestAnimationFrame(animate);
      };

      // Start animation loop
      animate();

      // Handle XR session state
      sceneRef.current.renderer.xr.addEventListener('sessionstart', () => {
        console.log('VR session started');
      });

      sceneRef.current.renderer.xr.addEventListener('sessionend', () => {
        console.log('VR session ended');
      });

      setIsInitializing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsInitializing(false);
      console.error('Initialization error:', err);
    }
  };

  useEffect(() => {
    initializeVisualization();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (sceneRef.current?.renderer) {
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);

  if (error || needsMicPermission) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              {needsMicPermission ? (
                <>
                  <Mic className="h-12 w-12 text-destructive" />
                  <h1 className="text-2xl font-bold">Microphone Access Required</h1>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please allow microphone access to experience the audio visualization.
                    You may need to click the microphone icon in your browser's address bar.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-destructive">
                    <RefreshCcw className="h-12 w-12" />
                  </div>
                  <h1 className="text-2xl font-bold">Error</h1>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                </>
              )}
              <Button 
                onClick={initializeVisualization}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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