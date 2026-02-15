'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { PaymentStatus, PaymentMethod } from '@/lib/wallet/types';
import { cn } from '@/lib/utils';

interface PaymentLoadingOverlayProps {
  isOpen: boolean;
  status: PaymentStatus;
  message: string;
  amount: number;
  method: PaymentMethod;
  onClose?: () => void;
  onRetry?: () => void;
}

const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
  switch (method) {
    case 'upi':
      return <Smartphone className="h-6 w-6" />;
    case 'card':
      return <CreditCard className="h-6 w-6" />;
    case 'netbanking':
      return <Building2 className="h-6 w-6" />;
  }
};

const PaymentMethodLabel = ({ method }: { method: PaymentMethod }) => {
  switch (method) {
    case 'upi':
      return 'UPI Payment';
    case 'card':
      return 'Card Payment';
    case 'netbanking':
      return 'Net Banking';
  }
};

export function PaymentLoadingOverlay({
  isOpen,
  status,
  message,
  amount,
  method,
  onClose,
  onRetry,
}: PaymentLoadingOverlayProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        onClose?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const isProcessing = status === 'pending' || status === 'processing';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
              {/* Header */}
              <div className="bg-primary/10 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <PaymentMethodIcon method={method} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      <PaymentMethodLabel method={method} />
                    </p>
                    <p className="text-2xl font-bold font-typewriter">
                      ₹{amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Area */}
              <div className="px-6 py-8 flex flex-col items-center">
                {/* Animated Icon */}
                <div className="relative mb-6">
                  {isProcessing && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="h-16 w-16 text-primary" />
                    </motion.div>
                  )}

                  {isSuccess && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                      <div className="relative">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 rounded-full bg-green-500/30"
                        />
                      </div>
                    </motion.div>
                  )}

                  {isFailed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    >
                      <XCircle className="h-16 w-16 text-destructive" />
                    </motion.div>
                  )}
                </div>

                {/* Status Message */}
                <motion.p
                  key={message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-center font-medium',
                    isSuccess && 'text-green-600',
                    isFailed && 'text-destructive'
                  )}
                >
                  {message}
                </motion.p>

                {/* Progress Dots for Processing */}
                {isProcessing && (
                  <div className="flex gap-1 mt-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Retry Button for Failed */}
                {isFailed && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onRetry}
                      className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Security Note */}
              {isProcessing && (
                <div className="px-6 py-3 bg-muted/50 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Secure payment processing. Do not close this window.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PaymentLoadingOverlay;
