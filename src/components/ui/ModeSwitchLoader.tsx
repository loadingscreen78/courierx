'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Truck } from 'lucide-react';
import type { ShippingMode } from '@/contexts/ShippingModeContext';

interface ModeSwitchLoaderProps {
  visible: boolean;
  targetMode: ShippingMode;
}

export const ModeSwitchLoader = ({ visible, targetMode }: ModeSwitchLoaderProps) => {
  const isInternational = targetMode === 'international';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mode-switch-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'hsl(var(--background))' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            {/* Animated icon ring */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 rounded-full border-2 border-dashed border-coke-red/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2 border-dashed border-coke-red/15"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-2xl bg-coke-red flex items-center justify-center shadow-lg shadow-coke-red/40"
                >
                  {isInternational ? (
                    <Globe className="h-6 w-6 text-white" />
                  ) : (
                    <Truck className="h-6 w-6 text-white" />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Mode label */}
            <div className="text-center space-y-1.5">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              >
                Switching to
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="text-2xl font-bold font-typewriter text-foreground"
              >
                {isInternational ? 'International' : 'Domestic'}{' '}
                <span className="text-coke-red">Mode</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-sm text-muted-foreground"
              >
                {isInternational
                  ? 'Ship to 150+ countries worldwide'
                  : 'Fast delivery across India'}
              </motion.p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-coke-red"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
