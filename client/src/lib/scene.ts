import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import type { AudioData } from './audio';

const NUM_BARS = 32;
const RADIUS = 2;

export function initScene(container: HTMLElement) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Renderer with WebXR support
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  // Ensure container is empty before appending
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Add VR button with session change handling
  const vrButton = VRButton.createButton(renderer);
  document.body.appendChild(vrButton);

  // Create visualization mesh
  const group = new THREE.Group();
  scene.add(group);

  // Create circular array of bars
  for (let i = 0; i < NUM_BARS; i++) {
    const geometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(i / NUM_BARS, 1, 0.5),
    });
    const bar = new THREE.Mesh(geometry, material);

    const angle = (i / NUM_BARS) * Math.PI * 2;
    bar.position.x = Math.cos(angle) * RADIUS;
    bar.position.z = Math.sin(angle) * RADIUS;
    bar.rotation.y = -angle;

    group.add(bar);
  }

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Handle WebXR session changes
  renderer.xr.addEventListener('sessionstart', () => {
    // Position the group slightly lower in VR for better viewing
    group.position.y = -1;
  });

  renderer.xr.addEventListener('sessionend', () => {
    // Reset position when exiting VR
    group.position.y = 0;
  });

  // Handle resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  // Start render loop
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  return { scene, camera, renderer, group };
}

export function updateVisualization(group: THREE.Group, audioData: AudioData) {
  const { frequencies } = audioData;

  // Update each bar based on frequency data
  group.children.forEach((bar, i) => {
    if (bar instanceof THREE.Mesh) {
      const value = frequencies[Math.floor(i * frequencies.length / NUM_BARS)] / 255;
      bar.scale.y = 1 + value * 5; // Adjust bar height
      bar.position.y = (bar.scale.y / 2) - (group.position.y ? 1 : 0); // Adjust for VR positioning

      // Update color based on intensity
      if (bar.material instanceof THREE.MeshPhongMaterial) {
        bar.material.color.setHSL(i / NUM_BARS, 1, 0.3 + value * 0.7);
      }
    }
  });

  // Slowly rotate the entire visualization
  group.rotation.y += 0.002;
}