let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playBeep = (freq = 440, duration = 0.1, type: OscillatorType = 'square') => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};

export const playRetroSound = (effect: 'click' | 'success' | 'error' | 'typing') => {
  switch (effect) {
    case 'click':
      playBeep(800, 0.05, 'square');
      break;
    case 'success':
      playBeep(600, 0.1, 'sine');
      setTimeout(() => playBeep(1200, 0.2, 'square'), 100);
      break;
    case 'error':
      playBeep(150, 0.3, 'sawtooth');
      break;
    case 'typing':
      playBeep(1000 + Math.random() * 500, 0.03, 'square');
      break;
  }
};