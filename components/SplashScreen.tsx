import React, { useEffect, useState } from 'react';
import { playRetroSound } from '../utils/sound';

interface SplashScreenProps {
  onComplete: () => void;
  muted: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, muted }) => {
  const [lines, setLines] = useState<string[]>([]);
  
  const bootSequence = [
    "PIXEL_OS v1.0.4 (C) 1995",
    "Memory Test: 640K OK",
    "Initializing Video Adapter... VGA DETECTED",
    "Loading Privacy Modules... [OK]",
    "Checking Storage... NO SERVER FOUND (Good!)",
    "Mounting Local Drive C: ...",
    "Starting EXIF_VIEWER.EXE...",
    "READY."
  ];

  useEffect(() => {
    let delay = 0;
    let mounted = true;

    bootSequence.forEach((line, index) => {
      delay += Math.random() * 600 + 200;
      setTimeout(() => {
        if (!mounted) return;
        setLines(prev => [...prev, line]);
        if (!muted) playRetroSound('typing');
        
        if (index === bootSequence.length - 1) {
          setTimeout(onComplete, 1000);
        }
      }, delay);
    });

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-full bg-black text-[#33ff00] font-terminal text-xl p-8 flex flex-col justify-start items-start crt-flicker overflow-hidden">
      {lines.map((line, i) => (
        <div key={i} className="mb-2 w-full break-words glow-text">
          <span className="mr-2">{'>'}</span>{line}
        </div>
      ))}
      <div className="animate-pulse mt-2 inline-block w-3 h-5 bg-[#33ff00]"></div>
    </div>
  );
};