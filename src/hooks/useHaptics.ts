import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50],
};

export const useHaptics = () => {
  const vibrate = useCallback((type: HapticType = 'light') => {
    // Check if vibration API is supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(vibrationPatterns[type]);
      } catch (error) {
        // Silently fail if vibration is not available
        console.debug('Haptic feedback not available');
      }
    }
  }, []);

  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const successFeedback = useCallback(() => vibrate('success'), [vibrate]);
  const warningFeedback = useCallback(() => vibrate('warning'), [vibrate]);
  const errorFeedback = useCallback(() => vibrate('error'), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successFeedback,
    warningFeedback,
    errorFeedback,
  };
};
