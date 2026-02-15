import { useCallback, useRef } from 'react';

type SoundType = 'success' | 'click' | 'notification' | 'error' | 'whoosh';

// Base64 encoded minimal sound effects (very small footprint)
const sounds: Record<SoundType, string> = {
  // Simple beep sounds using Web Audio API will be generated
  success: 'success',
  click: 'click',
  notification: 'notification',
  error: 'error',
  whoosh: 'whoosh',
};

export const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Smooth fade out
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.debug('Sound effects not available');
    }
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    switch (type) {
      case 'success':
        // Pleasant ascending two-tone
        playTone(523.25, 0.1); // C5
        setTimeout(() => playTone(659.25, 0.15), 100); // E5
        break;
      case 'click':
        // Quick subtle click
        playTone(800, 0.05, 'square', 0.05);
        break;
      case 'notification':
        // Gentle notification bell
        playTone(880, 0.1); // A5
        setTimeout(() => playTone(1108.73, 0.15), 80); // C#6
        break;
      case 'error':
        // Low warning tone
        playTone(220, 0.15, 'sawtooth', 0.08);
        break;
      case 'whoosh':
        // Quick whoosh effect using noise
        playTone(400, 0.08, 'triangle', 0.05);
        break;
    }
  }, [playTone]);

  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playWhoosh = useCallback(() => playSound('whoosh'), [playSound]);

  return {
    playSound,
    playSuccess,
    playClick,
    playNotification,
    playError,
    playWhoosh,
  };
};
