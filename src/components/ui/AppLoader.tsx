'use client';

import { useState, useEffect } from 'react';
import { TruckLoader } from './TruckLoader';

interface AppLoaderProps {
  isLoading?: boolean;
}

export const AppLoader = ({ isLoading = true }: AppLoaderProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Keep mounted briefly for fade-out animation
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="app-loader"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAF8',
        zIndex: 9999,
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 0.35s ease-out',
        pointerEvents: isLoading ? 'auto' : 'none',
      }}
    >
      <div className="app-loader__content">
        <TruckLoader />
        <div className="app-loader__brand">
          <span className="app-loader__brand-name" style={{ color: '#000000' }}>Courier</span>
          <span className="app-loader__brand-accent">X</span>
        </div>
        <p className="app-loader__tagline">Shipping Essentials Worldwide</p>
      </div>
    </div>
  );
};
