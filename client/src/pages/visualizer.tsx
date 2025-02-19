import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { initScene, updateVisualization } from '@/lib/scene';
import { setupAudioAnalyzer } from '@/lib/audio';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, RefreshCcw, Headphones } from "lucide-react";

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
  const [isInitializing, setIsInitializing] = useState(false);
  const [needsMicPermission, setNeedsMicPermission] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const startVisualization = () => {
    console.log('Start visualization clicked');
    if (!containerRef.current || isInitializing) return;

    setIsInitializing(true);
    setError('');
    setIsReady(false);

    const initialize = async () => {
      try {
        // Check WebXR support
        if (!navigator.xr) {
          throw new Error('WebXR not supported in this browser.');
        }

        // Request microphone access
        const analyzer = await setupAudioAnalyzer();

        // Initialize scene
        if (!containerRef.current) return;
        sceneRef.current = initScene(containerRef.current);

        // Setup animation loop
        const animate = () => {
          if (!sceneRef.current || !analyzer) return;

          const audioData = analyzer.getAudioData();
          updateVisualization(sceneRef.current.group, audioData);

          frameRef.current = requestAnimationFrame(animate);
        };

        animate();
        setIsReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start visualization';
        console.error('Visualization error:', message);
        setError(message);
        if (message.includes('denied')) {
          setNeedsMicPermission(true);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  };

  // Cleanup
  useEffect(() => {
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
                onClick={startVisualization}
                className="w-full"
                type="button"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <Headphones className="h-12 w-12 text-primary animate-pulse" />
              <h1 className="text-2xl font-bold">Start Audio Visualization</h1>
              <p className="text-sm text-muted-foreground">
                Click the button below to start. You'll be prompted for microphone access.
              </p>
              <Button 
                onClick={startVisualization}
                className="w-full"
                type="button"
                disabled={isInitializing}
              >
                {isInitializing ? 'Initializing...' : 'Start Visualization'}
              </Button>
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