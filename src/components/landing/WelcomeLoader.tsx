import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';

interface WelcomeLoaderProps {
  isLoading: boolean;
}

export const WelcomeLoader = ({ isLoading }: WelcomeLoaderProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        >
          <div className="relative flex flex-col items-center">
            {/* Animated Package Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.2
              }}
              className="relative"
            >
              {/* Pulsing ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-coke-red/20"
              />
              
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-charcoal to-charcoal/80 flex items-center justify-center shadow-2xl"
              >
                <Package className="w-12 h-12 text-paper-white" />
              </motion.div>
            </motion.div>

            {/* Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 text-center"
            >
              <h1 className="text-3xl font-typewriter font-bold tracking-tight">
                <span className="text-foreground">Courier</span><span className="text-coke-red">X</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-muted-foreground text-sm mt-2"
              >
                Shipping Essentials Worldwide
              </motion.p>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-8 h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-coke-red to-transparent"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
