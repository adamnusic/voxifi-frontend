import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export async function setupScene(container: HTMLDivElement) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 3;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);
  container.appendChild(VRButton.createButton(renderer));

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 2);
  scene.add(directionalLight);

  // Audio visualization setup
  const visualizerGeometry = new THREE.IcosahedronGeometry(1, 2);
  const visualizerMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    wireframe: true,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5
  });
  const visualizer = new THREE.Mesh(visualizerGeometry, visualizerMaterial);
  scene.add(visualizer);

  // Controllers setup
  const controllerModelFactory = new XRControllerModelFactory();

  const controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  // Animation loop
  renderer.setAnimationLoop(() => {
    visualizer.rotation.x += 0.001;
    visualizer.rotation.y += 0.002;
    renderer.render(scene, camera);
  });

  // Window resize handler
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  // Audio visualization update
  function updateVisualization(audioData: Float32Array) {
    const average = audioData.reduce((acc, val) => acc + (val + 140) / 140, 0) / audioData.length;
    
    // Scale visualization based on audio intensity
    visualizer.scale.setScalar(1 + average * 0.2);
    
    // Update material properties
    const hue = (average * 0.1) % 1;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    (visualizer.material as THREE.MeshPhongMaterial).color = color;
    (visualizer.material as THREE.MeshPhongMaterial).emissive = color;
  }

  return {
    updateVisualization,
    cleanup: () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      container.innerHTML = '';
    }
  };
}
