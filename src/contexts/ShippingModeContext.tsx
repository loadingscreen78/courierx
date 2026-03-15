'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ShippingMode = 'international' | 'domestic';

interface ShippingModeContextType {
  mode: ShippingMode;
  isSwitching: boolean;
  setMode: (mode: ShippingMode) => void;
  toggleMode: () => void;
}

const ShippingModeContext = createContext<ShippingModeContextType | undefined>(undefined);

export const ShippingModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ShippingMode>('international');
  const [isSwitching, setIsSwitching] = useState(false);

  const setMode = useCallback((newMode: ShippingMode) => {
    if (newMode === mode) return;
    setIsSwitching(true);
    setTimeout(() => {
      setModeState(newMode);
      setTimeout(() => setIsSwitching(false), 600);
    }, 800);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode(mode === 'international' ? 'domestic' : 'international');
  }, [mode, setMode]);

  return (
    <ShippingModeContext.Provider value={{ mode, isSwitching, setMode, toggleMode }}>
      {children}
    </ShippingModeContext.Provider>
  );
};

export const useShippingMode = () => {
  const ctx = useContext(ShippingModeContext);
  if (!ctx) throw new Error('useShippingMode must be used within ShippingModeProvider');
  return ctx;
};
