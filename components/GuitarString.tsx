
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';

interface Props {
  frequency: number;
  label: string;
  color: string;
}

const GuitarString: React.FC<Props> = ({ frequency, label, color }) => {
  const [offset, setOffset] = useState(0);
  const [vibration, setVibration] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const stringId = useRef(`s-${label}-${frequency}`);

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (!isPressed && Math.abs(vibration) > 0.01) {
      setVibration(prev => prev * Math.pow(0.96, deltaTime / 8) * Math.cos(time * 0.12));
    } else if (!isPressed) {
      setVibration(0);
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isPressed, vibration]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsPressed(true);
    audioEngine.startNote(stringId.current, frequency);
    
    // S24 Ultra Haptics
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!isPressed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const newOffset = (e.clientY - centerY) * 0.9;
    const clamped = Math.max(-70, Math.min(70, newOffset));
    setOffset(clamped);
    audioEngine.updateBend(stringId.current, clamped);
    
    // Effetto "scatto" della corda se tirata molto
    if (Math.abs(clamped) > 50 && 'vibrate' in navigator) navigator.vibrate(2);
  };

  const onUp = () => {
    setIsPressed(false);
    setVibration(offset);
    setOffset(0);
    if ('vibrate' in navigator) navigator.vibrate(10);
    setTimeout(() => audioEngine.stopNote(stringId.current), 400);
  };

  const d = `M 0 50 Q 400 ${50 + offset + vibration} 800 50`;

  return (
    <div 
      className="relative w-full h-20 sm:h-24 flex items-center justify-center touch-none cursor-pointer group"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div className="absolute left-4 sm:left-6 text-[10px] font-black text-white/10 group-hover:text-white/30 transition-colors uppercase tracking-widest">{label}</div>
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 800 100" preserveAspectRatio="none">
        <path d={d} fill="none" stroke={color} strokeWidth="8" className="opacity-[0.05] blur-xl" />
        <path d={d} fill="none" stroke={color} strokeWidth={isPressed ? "3" : "1.5"} strokeLinecap="round" style={{ filter: isPressed ? `drop-shadow(0 0 12px ${color}88)` : 'none', transition: 'stroke-width 0.1s' }} />
        <path d={d} fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
      </svg>
    </div>
  );
};

export default GuitarString;
