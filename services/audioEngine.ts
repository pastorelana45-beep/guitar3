
import { ToneSettings, InstrumentProfile } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private delay: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private activeNotes: Map<string, {osc: OscillatorNode, vca: GainNode}> = new Map();
  private profile: InstrumentProfile | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
      latencyHint: 'interactive',
      sampleRate: 44100
    });
    
    this.masterGain = this.ctx.createGain();
    this.analyzer = this.ctx.createAnalyser();
    this.analyzer.fftSize = 128;
    
    this.limiter = this.ctx.createDynamicsCompressor();
    this.filter = this.ctx.createBiquadFilter();
    this.distortion = this.ctx.createWaveShaper();
    
    // Setup Delay (Reverb-like effect)
    this.delay = this.ctx.createDelay(1.0);
    this.delayFeedback = this.ctx.createGain();
    this.delay.delayTime.setValueAtTime(0.3, this.ctx.currentTime);
    this.delayFeedback.gain.setValueAtTime(0.2, this.ctx.currentTime);

    // Routing
    this.distortion.connect(this.filter);
    this.filter.connect(this.delay);
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    
    this.filter.connect(this.limiter);
    this.delay.connect(this.limiter);
    
    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.analyzer.connect(this.ctx.destination);
    
    this.updateSettings({ gain: 0.6, distortion: 0.2, tone: 0.5, reverb: 0.3 });
  }

  getAnalyser() { return this.analyzer; }

  setProfile(p: InstrumentProfile) {
    this.profile = p;
    if (this.filter && this.ctx) {
      this.filter.type = 'lowpass';
      this.filter.frequency.setTargetAtTime(p.filterFreq, this.ctx.currentTime, 0.05);
    }
  }

  updateSettings(s: ToneSettings) {
    if (!this.ctx || !this.masterGain || !this.distortion || !this.filter || !this.delayFeedback) return;
    this.masterGain.gain.setTargetAtTime(s.gain, this.ctx.currentTime, 0.02);
    this.delayFeedback.gain.setTargetAtTime(s.reverb * 0.5, this.ctx.currentTime, 0.1);
    
    const k = s.distortion * 100;
    const curve = new Float32Array(44100);
    for (let i = 0; i < 44100; ++i) {
      const x = (i * 2) / 44100 - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    this.distortion.curve = curve;
    
    if (this.profile) {
      this.filter.frequency.setTargetAtTime(this.profile.filterFreq * (0.2 + s.tone * 2), this.ctx.currentTime, 0.05);
    }
  }

  startNote(id: string, freq: number) {
    if (!this.ctx || !this.profile) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopNote(id);
    const osc = this.ctx.createOscillator();
    const vca = this.ctx.createGain();

    osc.type = this.profile.oscType;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    vca.gain.setValueAtTime(0, this.ctx.currentTime);
    vca.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + this.profile.attack);

    osc.connect(vca);
    vca.connect(this.distortion!);
    osc.start();
    this.activeNotes.set(id, { osc, vca });
  }

  updateBend(id: string, amount: number) {
    const n = this.activeNotes.get(id);
    if (n && this.ctx) {
      n.osc.detune.setTargetAtTime(Math.abs(amount) * 4, this.ctx.currentTime, 0.03);
    }
  }

  stopNote(id: string) {
    const n = this.activeNotes.get(id);
    if (n && this.ctx && this.profile) {
      n.vca.gain.cancelScheduledValues(this.ctx.currentTime);
      n.vca.gain.setTargetAtTime(0, this.ctx.currentTime, this.profile.release);
      n.osc.stop(this.ctx.currentTime + this.profile.release * 2);
      this.activeNotes.delete(id);
    }
  }
}

export const audioEngine = new AudioEngine();
