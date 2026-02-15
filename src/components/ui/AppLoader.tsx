'use client';

import { TruckLoader } from './TruckLoader';

interface AppLoaderProps {
  isLoading?: boolean;
}

export const AppLoader = ({ isLoading = true }: AppLoaderProps) => {
  return (
    <div
      className="app-loader"
      style={{
        position: 'fixed',
        inset: 0,
        display: isLoading ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAF8',
        zIndex: 9999,
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
