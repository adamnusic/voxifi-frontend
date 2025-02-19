import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { setupAudioAnalyzer, type AudioData } from './audio';

const NUM_BARS = 128;
const BAR_WIDTH = 0.1;
const CIRCLE_RADIUS = 5;

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
  camera.position.z = 8;
  camera.position.y = 2;
  camera.lookAt(0, 0, 0);

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

  // Create visualization bars
  const bars: THREE.Mesh[] = [];
  const barGeometry = new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_WIDTH);

  for (let i = 0; i < NUM_BARS; i++) {
    const angle = (i / NUM_BARS) * Math.PI * 2;
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(i / NUM_BARS, 0.8, 0.5),
      emissive: new THREE.Color(0x222222),
      shininess: 50
    });

    const bar = new THREE.Mesh(barGeometry, material);

    // Position in circle
    bar.position.x = Math.cos(angle) * CIRCLE_RADIUS;
    bar.position.z = Math.sin(angle) * CIRCLE_RADIUS;
    bar.rotation.y = -angle;

    bars.push(bar);
    scene.add(bar);
  }

  // Enhanced center piece with more complex geometry
  const centerGeometry = new THREE.IcosahedronGeometry(1, 2); // Increased detail level
  const centerMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    wireframe: true,
    emissive: 0x222222,
    flatShading: true,
    transparent: true,
    opacity: 0.8
  });
  const centerPiece = new THREE.Mesh(centerGeometry, centerMaterial);

  // Add vertex distortion to geometry
  const originalPositions = centerGeometry.attributes.position.array.slice();
  scene.add(centerPiece);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0xff0000, 1, 50);
  pointLight1.position.set(10, 5, 0);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x0000ff, 1, 50);
  pointLight2.position.set(-10, -5, 0);
  scene.add(pointLight2);

  // Initialize audio analyzer (real or fallback)
  const analyzer = await setupAudioAnalyzer();

  let time = 0;

  // Animation loop
  function animate() {
    time += 0.005;
    const audioData = analyzer.getAudioData();

    // Update bars based on audio
    bars.forEach((bar, i) => {
      const freqIndex = Math.floor(i * audioData.frequencies.length / NUM_BARS);
      const frequency = audioData.frequencies[freqIndex];
      const value = frequency / 255;

      // Update bar height
      bar.scale.y = 1 + value * 5;
      bar.position.y = bar.scale.y / 2;

      // Update color based on frequency and volume
      if (bar.material instanceof THREE.MeshPhongMaterial) {
        const hue = (i / NUM_BARS + time * 0.1) % 1;
        const saturation = 0.8;
        const lightness = 0.3 + value * 0.4;
        bar.material.color.setHSL(hue, saturation, lightness);
        bar.material.emissive.setHSL(hue, saturation, lightness * 0.2);
      }
    });

    // Enhanced center piece animation
    // Get average frequency for overall intensity
    const avgFrequency = Array.from(audioData.frequencies)
      .reduce((sum, val) => sum + val, 0) / audioData.frequencies.length;
    const normalizedAvg = avgFrequency / 255;

    // Update center piece vertices based on audio with increased sensitivity
    const positions = centerGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const originalX = originalPositions[i];
      const originalY = originalPositions[i + 1];
      const originalZ = originalPositions[i + 2];

      // Increased distortion based on audio
      const distortion = 0.8 * normalizedAvg; // Increased from 0.3 to 0.8
      const frequencyIndex = Math.floor((i / positions.length) * audioData.frequencies.length);
      const frequencyValue = audioData.frequencies[frequencyIndex] / 255;

      // Create more dynamic vertex manipulation
      const noise = (
        Math.sin(time * 3 + i * 0.2) * distortion +
        Math.cos(time * 2 + i * 0.3) * distortion * frequencyValue
      );

      // Apply stronger deformation
      positions[i] = originalX * (1 + noise * 1.5);
      positions[i + 1] = originalY * (1 + noise * 1.5);
      positions[i + 2] = originalZ * (1 + noise * 1.5);
    }
    centerGeometry.attributes.position.needsUpdate = true;

    // More dramatic rotation based on audio
    centerPiece.rotation.x += 0.02 + audioData.volume * 0.2;
    centerPiece.rotation.y += 0.02 + audioData.volume * 0.2;
    centerPiece.rotation.z += audioData.volume * 0.1;

    // More pronounced pulsating scale based on volume
    const baseScale = 1 + audioData.volume * 1.5;
    const pulseScale = baseScale + Math.sin(time * 6) * audioData.volume * 0.5;
    centerPiece.scale.set(pulseScale, pulseScale, pulseScale);

    // More dramatic material updates
    if (centerPiece.material instanceof THREE.MeshPhongMaterial) {
      const hue = (time * 0.2) % 1;
      const saturation = 0.7 + audioData.volume * 0.3;
      const lightness = 0.3 + audioData.volume * 0.5;
      centerPiece.material.color.setHSL(hue, saturation, lightness);
      centerPiece.material.emissive.setHSL(hue, saturation * 0.7, lightness * 0.4);
      centerPiece.material.opacity = 0.4 + audioData.volume * 0.6;
    }

    // Animate lights
    pointLight1.position.x = Math.cos(time) * 10;
    pointLight1.position.z = Math.sin(time) * 10;
    pointLight2.position.x = Math.cos(time + Math.PI) * 10;
    pointLight2.position.z = Math.sin(time + Math.PI) * 10;
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