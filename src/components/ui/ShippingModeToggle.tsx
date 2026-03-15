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
        'relative flex items-center rounded-2xl border transition-all duration-300 select-none',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        compact ? 'h-9 w-[88px] p-1' : 'h-10 w-[100px] p-1',
        isInternational
          ? 'bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border-blue-800/50 shadow-lg shadow-blue-900/20'
          : 'bg-gradient-to-r from-green-950/80 to-emerald-950/80 border-green-800/50 shadow-lg shadow-green-900/20',
        className
      )}
    >
      {/* Sliding thumb */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'absolute top-1 rounded-xl flex items-center justify-center shadow-md',
          compact ? 'h-7 w-[38px]' : 'h-8 w-[44px]',
          isInternational
            ? 'left-1 bg-gradient-to-br from-blue-500 to-indigo-600'
            : 'right-1 bg-gradient-to-br from-green-500 to-emerald-600'
        )}
      >
        {isInternational ? (
          <Globe className="h-3.5 w-3.5 text-white" />
        ) : (
          <Truck className="h-3.5 w-3.5 text-white" />
        )}
      </motion.div>

      {/* Labels */}
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-colors duration-200',
        isInternational ? 'text-blue-300' : 'text-white/30'
      )}>
        Intl
      </span>
      <span className={cn(
        'relative z-10 flex-1 text-center text-[9px] font-bold uppercase tracking-wider transition-colors duration-200',
        !isInternational ? 'text-green-300' : 'text-white/30'
      )}>
        Dom
      </span>
    </button>
  );
};
