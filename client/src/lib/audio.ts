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
  private source: MediaStreamAudioSourceNode;

  constructor(stream: MediaStream) {
    // Create audio context with auto-suspend disabled for VR
    this.context = new AudioContext({ 
      latencyHint: 'interactive',
      sampleRate: 44100
    });

    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = FFT_SIZE;

    this.source = this.context.createMediaStreamSource(stream);
    this.source.connect(this.analyzer);

    this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount);
    this.waveformData = new Uint8Array(this.analyzer.frequencyBinCount);
  }

  getAudioData(): AudioData {
    // Resume context if suspended
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

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

  // Clean up
  dispose() {
    this.source.disconnect();
    this.analyzer.disconnect();
    this.context.close();
  }
}

export async function setupAudioAnalyzer(): Promise<AudioAnalyzer> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });
    return new AudioAnalyzer(stream);
  } catch (err) {
    throw new Error('Microphone access denied. Please allow microphone access to use the visualizer.');
  }
}