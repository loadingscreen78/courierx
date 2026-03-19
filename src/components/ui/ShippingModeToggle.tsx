'use client';

import { motion } from 'framer-motion';
import { Globe, Truck } from 'lucide-react';
import { useShippingMode } from '@/contexts/ShippingModeContext';
import { cn } from '@/lib/utils';

interface ShippingModeToggleProps {
  compact?: boolean;
  className?: string;
}

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
        // Track: dark charcoal base, always consistent
        'bg-[#1a1a1a] border-white/10 shadow-lg',
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
          // International = Coke Red, Domestic = Charcoal/white
          isInternational
            ? 'left-1 bg-gradient-to-br from-[#F40000] to-[#c00000]'
            : 'right-1 bg-gradient-to-br from-[#3a3a3a] to-[#222222] border border-white/20'
        )}
      >
        {isInternational ? (
          <Globe className="h-3.5 w-3.5 text-white" />
        ) : (
          <Truck className="h-3.5 w-3.5 text-white/80" />
        )}
      </motion.div>

      {/* Labels */}
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-all duration-300',
        isInternational ? 'text-white/90' : 'text-white/25'
      )}>
        Intl
      </span>
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-all duration-300',
        !isInternational ? 'text-white/90' : 'text-white/25'
      )}>
        Dom
      </span>
    </button>
  );
};
