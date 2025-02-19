const FFT_SIZE = 1024;

export interface AudioData {
  frequencies: Uint8Array;
  waveform: Uint8Array;
  volume: number;
}

class AudioAnalyzer {
  private context: AudioContext;
  private analyzer: AnalyserNode;
  private frequencyData: Uint8Array;
  private waveformData: Uint8Array;

  constructor(stream: MediaStream) {
    this.context = new AudioContext();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = FFT_SIZE;

    const source = this.context.createMediaStreamSource(stream);
    source.connect(this.analyzer);

    this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount);
    this.waveformData = new Uint8Array(this.analyzer.frequencyBinCount);
  }

  getAudioData(): AudioData {
    this.analyzer.getByteFrequencyData(this.frequencyData);
    this.analyzer.getByteTimeDomainData(this.waveformData);

    // Calculate volume from waveform
    const volume = Array.from(this.waveformData)
      .reduce((acc, val) => acc + Math.abs(val - 128), 0) / this.waveformData.length;

    return {
      frequencies: this.frequencyData,
      waveform: this.waveformData,
      volume: volume / 128 // Normalize to 0-1
    };
  }
}

// Fallback analyzer that provides dummy data for visualization
class FallbackAnalyzer {
  private time: number;
  private frequencyData: Uint8Array;
  private waveformData: Uint8Array;

  constructor() {
    this.time = 0;
    this.frequencyData = new Uint8Array(FFT_SIZE / 2);
    this.waveformData = new Uint8Array(FFT_SIZE / 2);
  }

  getAudioData(): AudioData {
    this.time += 0.01;

    // Generate synthetic frequency data
    for (let i = 0; i < this.frequencyData.length; i++) {
      this.frequencyData[i] = 
        128 + // Base amplitude
        127 * Math.sin(this.time + i * 0.1) * // Oscillation
        Math.exp(-i * 0.01); // Frequency falloff
    }

    // Generate synthetic waveform
    for (let i = 0; i < this.waveformData.length; i++) {
      this.waveformData[i] = 
        128 + // Center point
        127 * Math.sin(this.time * 2 + i * 0.1); // Oscillation
    }

    return {
      frequencies: this.frequencyData,
      waveform: this.waveformData,
      volume: (Math.sin(this.time) + 1) * 0.5 // Oscillating volume between 0-1
    };
  }
}

export async function setupAudioAnalyzer(): Promise<AudioAnalyzer | FallbackAnalyzer> {
  try {
    // Check for audio input devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudioInput = devices.some(device => device.kind === 'audioinput');

    if (!hasAudioInput) {
      console.log('No audio input devices found, using fallback visualization');
      return new FallbackAnalyzer();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true,
      video: false
    });
    return new AudioAnalyzer(stream);
  } catch (err) {
    console.log('Audio input not available, using fallback visualization');
    return new FallbackAnalyzer();
  }
}