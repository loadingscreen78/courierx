'use client';

import { motion } from 'framer-motion';
import { useShippingMode } from '@/contexts/ShippingModeContext';
import { cn } from '@/lib/utils';

interface ShippingModeToggleProps {
  compact?: boolean;
  className?: string;
}

// Inline SVG icons — no lucide dependency, more expressive
const GlobeIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 3C12 3 8.5 7 8.5 12C8.5 17 12 21 12 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 3C12 3 15.5 7 15.5 12C15.5 17 12 21 12 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M3.5 12H20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const TruckIcon = ({ className }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 4h13v12H1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M14 9h4.5L22 12.5V16h-8V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="5.5" cy="19" r="2" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="18.5" cy="19" r="2" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

export const ShippingModeToggle = ({ compact = false, className }: ShippingModeToggleProps) => {
  const { mode, toggleMode, isSwitching } = useShippingMode();
  const isInternational = mode === 'international';

  return (
    <button
      onClick={toggleMode}
      disabled={isSwitching}
      aria-label={`Switch to ${isInternational ? 'domestic' : 'international'} mode`}
      className={cn(
        'relative flex items-center rounded-2xl border transition-all duration-300 select-none overflow-hidden',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        compact ? 'h-9 w-[88px] p-1' : 'h-10 w-[100px] p-1',
        'bg-[#141414] border-white/10 shadow-md',
        isInternational && 'shadow-[#F40000]/10',
        className
      )}
    >
      {/* Sliding thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        className={cn(
          'absolute top-1 rounded-xl flex items-center justify-center shadow-md z-10',
          compact ? 'h-7 w-[38px]' : 'h-8 w-[44px]',
          isInternational
            ? 'left-1 bg-gradient-to-br from-[#F40000] to-[#b00000] shadow-[#F40000]/30'
            : 'right-1 bg-[#2a2a2a] border border-white/15'
        )}
      >
        {isInternational
          ? <GlobeIcon className="text-white" />
          : <TruckIcon className="text-white/75" />
        }
      </motion.div>

      {/* Labels */}
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-all duration-300',
        isInternational ? 'text-white/85' : 'text-white/20'
      )}>
        Intl
      </span>
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-all duration-300',
        !isInternational ? 'text-white/85' : 'text-white/20'
      )}>
        Dom
      </span>
    </button>
  );
};
