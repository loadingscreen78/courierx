'use client';

import { motion } from 'framer-motion';
import { useShippingMode } from '@/contexts/ShippingModeContext';
import { cn } from '@/lib/utils';

interface ShippingModeToggleProps {
  compact?: boolean;
  className?: string;
}

export const ShippingModeToggle = ({ compact = false, className }: ShippingModeToggleProps) => {
  const { mode, toggleMode, isSwitching } = useShippingMode();
  const isInternational = mode === 'international';

  const h = compact ? 'h-9' : 'h-10';
  const thumbH = compact ? 'h-7' : 'h-8';
  const thumbW = compact ? 'w-9' : 'w-10';

  return (
    <button
      onClick={toggleMode}
      disabled={isSwitching}
      aria-label={`Switch to ${isInternational ? 'domestic' : 'international'} mode`}
      className={cn(
        'relative flex items-center gap-1 rounded-2xl border px-1 transition-all duration-300 select-none',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        h,
        'bg-[#141414] border-white/10 shadow-md',
        className
      )}
    >
      {/* INTL side */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl transition-all duration-300',
        thumbH, thumbW,
        isInternational
          ? 'bg-gradient-to-br from-[#F40000] to-[#b00000] shadow-lg shadow-[#F40000]/25'
          : 'bg-transparent'
      )}>
        {/* Globe icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          className={cn('transition-colors duration-300', isInternational ? 'text-white' : 'text-white/25')}
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 3c0 0-3.5 4-3.5 9s3.5 9 3.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 3c0 0 3.5 4 3.5 9s-3.5 9-3.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M3.5 12h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* DOM side */}
      <div className={cn(
        'relative flex items-center justify-center rounded-xl transition-all duration-300',
        thumbH, thumbW,
        !isInternational
          ? 'bg-[#2a2a2a] border border-white/15'
          : 'bg-transparent'
      )}>
        {/* Map pin icon for domestic */}
        <svg width="13" height="15" viewBox="0 0 20 24" fill="none"
          className={cn('transition-colors duration-300', !isInternational ? 'text-white/80' : 'text-white/25')}
        >
          <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
      </div>
    </button>
  );
};
