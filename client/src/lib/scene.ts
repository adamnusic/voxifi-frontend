import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { setupAudioAnalyzer, type AudioData } from './audio';

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

  // Add VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // Create a reactive visualization
  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    wireframe: true 
  });
  const torusKnot = new THREE.Mesh(geometry, material);
  scene.add(torusKnot);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Initialize audio analyzer (real or fallback)
  const analyzer = await setupAudioAnalyzer();

  // Animation loop
  function animate() {
    const audioData = analyzer.getAudioData();

    // Update torus knot based on audio
    if (torusKnot) {
      // Scale based on volume
      const scale = 1 + audioData.volume * 2;
      torusKnot.scale.set(scale, scale, scale);

      // Rotate based on frequencies
      torusKnot.rotation.x += 0.01 + audioData.volume * 0.1;
      torusKnot.rotation.y += 0.01 + audioData.volume * 0.1;

      // Change color based on dominant frequency
      const dominantFreq = Math.max(...Array.from(audioData.frequencies));
      const hue = (dominantFreq / 255) * 0.3 + 0.2;  // Keep in green-blue range
      if (material instanceof THREE.MeshPhongMaterial) {
        material.color.setHSL(hue, 1, 0.5);
      }
    }
  }

  // Start render loop
  renderer.setAnimationLoop(() => {
    animate();
    renderer.render(scene, camera);
  });

  // Handle resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);
}