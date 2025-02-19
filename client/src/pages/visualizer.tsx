import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initScene } from '@/lib/scene';

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    initScene(containerRef.current);
  }, []);

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