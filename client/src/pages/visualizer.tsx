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

  const checkWebXRSupport = async () => {
    if (!navigator.xr) {
      throw new Error('WebXR not supported in this browser. Please use a WebXR-compatible browser.');
    }
    try {
      // Check if 'immersive-vr' is supported
      const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!isSupported) {
        throw new Error('VR not supported on this device/browser.');
      }
    } catch (err) {
      throw new Error('VR support check failed. Please ensure your browser supports WebXR.');
    }
  };

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
      setIsReady(false);

      // First check WebXR support
      await checkWebXRSupport();

      // Then initialize audio
      const analyzer = await initAudio();

      // Only initialize scene after we have audio permission
      sceneRef.current = initScene(containerRef.current);

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

      setIsReady(true);
      setIsInitializing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsInitializing(false);
      console.error('Initialization error:', err);
    }
  };

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

  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <Headphones className="h-12 w-12 text-primary animate-pulse" />
              <h1 className="text-2xl font-bold">Starting Audio Visualizer</h1>
              <p className="text-sm text-muted-foreground">
                Click the button below to start. You'll be prompted for microphone access.
              </p>
              <Button 
                onClick={initializeVisualization}
                className="w-full"
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