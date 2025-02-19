export async function setupAudio(onAudioData: (data: Float32Array) => void) {
  // Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Set up Web Audio API
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  // Configure analyser
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  
  // Connect nodes
  source.connect(analyser);
  
  // Start analysis loop
  let animationFrame: number;
  
  function analyze() {
    analyser.getFloatFrequencyData(dataArray);
    onAudioData(dataArray);
    animationFrame = requestAnimationFrame(analyze);
  }
  
  analyze();
  
  return {
    cleanup: () => {
      cancelAnimationFrame(animationFrame);
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    }
  };
}
