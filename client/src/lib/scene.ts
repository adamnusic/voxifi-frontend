import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import type { AudioData } from './audio';

const NUM_BARS = 64;
const BAR_SCALE = 0.05;
const RADIUS = 3;

export async function initScene(container: HTMLElement) {
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

  // Add VR button and ensure it's properly styled
  const vrButton = VRButton.createButton(renderer);
  vrButton.style.position = 'absolute';
  vrButton.style.bottom = '20px';
  vrButton.style.left = '50%';
  vrButton.style.transform = 'translateX(-50%)';
  vrButton.style.zIndex = '100';
  document.body.appendChild(vrButton);

  // Create visualization object
  const visualization = createVisualization();
  scene.add(visualization);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Start render loop
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  // Handle resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  return { scene, camera, renderer, visualization };
}

function createVisualization() {
  const group = new THREE.Group();

  // Create bars
  for (let i = 0; i < NUM_BARS; i++) {
    const geometry = new THREE.BoxGeometry(BAR_SCALE, 1, BAR_SCALE);
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

  return group;
}

export function updateVisualization(visualization: THREE.Object3D, audioData: AudioData) {
  const { frequencies, volume } = audioData;

  // Update bar heights based on frequency data
  visualization.children.forEach((bar, i) => {
    if (bar instanceof THREE.Mesh) {
      const value = frequencies[Math.floor(i * frequencies.length / NUM_BARS)] / 255;
      bar.scale.y = 1 + value * 5;
      bar.position.y = bar.scale.y / 2;

      // Update color based on intensity
      if (bar.material instanceof THREE.MeshPhongMaterial) {
        bar.material.color.setHSL(i / NUM_BARS, 1, 0.3 + value * 0.7);
      }
    }
  });

  // Rotate based on volume
  visualization.rotation.y += volume * 0.02;
}