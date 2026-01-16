
import React from 'react';
import { ToneSettings } from '../types';

interface Props {
  settings: ToneSettings;
  onChange: (settings: ToneSettings) => void;
}

const Controls: React.FC<Props> = ({ settings, onChange }) => {
  const handleChange = (key: keyof ToneSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  const ControlKnob = ({ label, value, field }: { label: string, value: number, field: keyof ToneSettings }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={value}
          onChange={(e) => handleChange(field, parseFloat(e.target.value))}
          className="w-24 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">{label}</span>
      <span className="text-xs font-mono text-amber-500">{Math.round(value * 100)}%</span>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-6 p-6 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
      <ControlKnob label="Gain" value={settings.gain} field="gain" />
      <ControlKnob label="Dist" value={settings.distortion} field="distortion" />
      <ControlKnob label="Tone" value={settings.tone} field="tone" />
      <ControlKnob label="Reverb" value={settings.reverb} field="reverb" />
    </div>
  );
};

export default Controls;
