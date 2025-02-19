import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initScene } from '@/lib/scene';
import { VoicePrintButton } from '@/components/VoicePrintButton';

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene and audio visualization
    initScene(containerRef.current).catch(console.error);
  }, []);

  const handleRecordingChange = (isRecording: boolean) => {
    // We can add visual feedback during recording if needed
    console.log('Recording state:', isRecording);
  };

  return (
    <>
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
      <VoicePrintButton onRecordingChange={handleRecordingChange} />
    </>
  );
}