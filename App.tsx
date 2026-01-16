
import React, { useState, useEffect, useRef } from 'react';
import GuitarString from './components/GuitarString';
import Controls from './components/Controls';
import { audioEngine } from './services/audioEngine';
import { ToneSettings, AITip, InstrumentProfile } from './types';
import { getToneAdvice } from './services/geminiService';
import { downloadSourceCode } from './services/exportService';

const INSTRUMENTS: InstrumentProfile[] = [
  { id: 'electric_guitar', name: 'Guitar Pro', icon: 'fa-guitar', oscType: 'sawtooth', attack: 0.005, release: 0.2, filterFreq: 3200, color: '#f59e0b', notes: [{ note: 'E', freq: 82.41 }, { note: 'A', freq: 110.00 }, { note: 'D', freq: 146.83 }, { note: 'G', freq: 196.00 }, { note: 'B', freq: 246.94 }, { note: 'e', freq: 329.63 }] },
  { id: 'bass', name: 'Deep Bass', icon: 'fa-drum', oscType: 'triangle', attack: 0.01, release: 0.15, filterFreq: 600, color: '#ef4444', notes: [{ note: 'E', freq: 41.20 }, { note: 'A', freq: 55.00 }, { note: 'D', freq: 73.42 }, { note: 'G', freq: 98.00 }] },
  { id: 'saxophone', name: 'Brass Sax', icon: 'fa-sax-hot', oscType: 'square', attack: 0.1, release: 0.2, filterFreq: 1200, color: '#fbbf24', notes: [{ note: 'Bb', freq: 116.54 }, { note: 'D', freq: 146.83 }, { note: 'F', freq: 174.61 }, { note: 'A', freq: 220.00 }] },
  { id: 'flute', name: 'Air Flute', icon: 'fa-wind', oscType: 'sine', attack: 0.15, release: 0.3, filterFreq: 4500, color: '#22d3ee', notes: [{ note: 'G', freq: 392.00 }, { note: 'A', freq: 440.00 }, { note: 'B', freq: 493.88 }, { note: 'C', freq: 523.25 }] }
];

const Spectrum: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const dataArray = new Uint8Array(analyser?.frequencyBinCount || 64);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgba(245, 158, 11, ${dataArray[i] / 255})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-12 opacity-60" width={300} height={60} />;
};

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [inst, setInst] = useState(INSTRUMENTS[0]);
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState<ToneSettings>({ gain: 0.5, distortion: 0.2, tone: 0.5, reverb: 0.2 });
  const [advice, setAdvice] = useState<AITip | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (started) {
      audioEngine.setProfile(inst);
      audioEngine.updateSettings(settings);
    }
  }, [inst, started, settings]);

  const handleStart = async () => {
    await audioEngine.init();
    setStarted(true);
  };

  const getAdvice = async () => {
    setLoading(true);
    const tip = await getToneAdvice(settings);
    setAdvice(tip);
    setLoading(false);
  };

  if (!started) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-10 text-center animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.5)]">
          <i className="fa-solid fa-play text-black text-4xl ml-1"></i>
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">MULTISTUDIO PRO</h1>
        <p className="text-zinc-500 text-[10px] mb-12 tracking-[0.4em] uppercase font-bold">120Hz Snapdragon Engine</p>
        <button onClick={handleStart} className="w-full max-w-xs py-5 bg-white text-black font-black rounded-2xl active:scale-95 transition-all shadow-xl">ENTRA NELLO STUDIO</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-12 max-w-[1600px] mx-auto w-full animate-slide-up">
      <header className="flex justify-between items-center mb-8">
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="s24-glass px-6 py-4 rounded-3xl flex items-center gap-4 active:scale-95 transition-all shadow-lg">
            <i className={`fa-solid ${inst.icon} text-amber-500 text-lg`}></i>
            <span className="font-bold text-sm tracking-tight">{inst.name}</span>
            <i className="fa-solid fa-chevron-down text-[10px] opacity-30"></i>
          </button>
          {menu && (
            <div className="absolute top-full left-0 mt-3 w-64 s24-glass rounded-3xl overflow-hidden z-50 shadow-2xl animate-fade-in">
              {INSTRUMENTS.map(i => (
                <button key={i.id} onClick={() => {setInst(i); setMenu(false);}} className={`w-full p-5 text-left flex items-center gap-4 hover:bg-white/5 transition-colors ${inst.id === i.id ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-400'}`}>
                  <i className={`fa-solid ${i.icon} w-6 text-center`}></i>
                  <span className="text-xs font-bold tracking-tight">{i.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button onClick={downloadSourceCode} className="s24-glass w-14 h-14 rounded-3xl flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-90">
            <i className="fa-solid fa-code text-sm"></i>
          </button>
          <button onClick={getAdvice} disabled={loading} className="s24-glass px-6 py-4 rounded-3xl flex items-center gap-3 active:scale-95 transition-all hover:border-amber-500/30">
            <i className={`fa-solid fa-wand-magic-sparkles text-sm ${loading ? 'animate-spin' : 'text-amber-500'}`}></i>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">AI Master</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch min-h-0">
        <div className="flex-1 s24-glass rounded-[3rem] flex flex-col justify-center p-6 lg:p-12 relative overflow-hidden border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none"></div>
          {inst.notes.map((n, idx) => (
            <GuitarString key={`${inst.id}-${idx}`} frequency={n.freq} label={n.note} color={inst.color} />
          ))}
        </div>

        <div className="lg:w-96 flex flex-col gap-8">
          <Controls settings={settings} onChange={setSettings} />
          
          {advice ? (
            <div className="s24-glass p-8 rounded-[2.5rem] border-amber-500/20 bg-amber-500/5 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{advice.title}</h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium">"{advice.content}"</p>
            </div>
          ) : (
            <div className="mt-auto s24-glass p-8 rounded-[2.5rem] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Master Output</span>
                <span className="text-[10px] font-bold text-emerald-500/80">LIVE ANALYZER</span>
              </div>
              <Spectrum />
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-8 flex justify-between items-center text-[9px] font-black text-zinc-700 tracking-[0.3em] uppercase">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span>S24 ULTRA ENGINE • 120HZ</span>
        </div>
        <span>LOW-LATENCY DSP ACTIVE</span>
      </footer>
    </div>
  );
};

export default App;
