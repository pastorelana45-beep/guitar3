
export interface ToneSettings {
  distortion: number;
  reverb: number;
  gain: number;
  tone: number;
}

export interface AITip {
  title: string;
  content: string;
}

export type InstrumentType = 'electric_guitar' | 'saxophone' | 'flute' | 'bass' | 'synth';

export interface InstrumentProfile {
  id: InstrumentType;
  name: string;
  icon: string;
  oscType: OscillatorType;
  attack: number;
  release: number;
  filterFreq: number;
  color: string;
  notes: Array<{note: string, freq: number}>;
}
