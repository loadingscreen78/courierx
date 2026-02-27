"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { RotateCcw, CheckCircle, XCircle, Wallet, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionClass = "bg-card border border-border rounded-2xl p-8";
const h2Class = "text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coke-red/10 text-coke-red mb-4">
              <RotateCcw className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Refund &amp; Cancellation Policy</h1>
            <p className="text-muted-foreground">Effective Date: 23rd February 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            {/* Refund Eligibility */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionClass}>
              <h2 className={h2Class}>
                <RotateCcw className="h-6 w-6 text-coke-red" />
                Refund Eligibility
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-4 text-foreground font-semibold">Stage</th>
                      <th className="text-left py-4 px-4 text-foreground font-semibold">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Stage 1 – Before Pickup</td>
                      <td className="py-4 px-4 text-candlestick-green font-semibold">100% refund to wallet</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Stage 2 – After Pickup but Before Export Clearance</td>
                      <td className="py-4 px-4 text-candlestick-green font-semibold">100% refund to wallet</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Stage 3 – After Customs Filing</td>
                      <td className="py-4 px-4 text-coke-red font-semibold">No refund</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Stage 4 – In Transit</td>
                      <td className="py-4 px-4 text-coke-red font-semibold">No refund</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4">Stage 5 – Delivered</td>
                      <td className="py-4 px-4 text-coke-red font-semibold">No refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-muted-foreground text-sm mt-4 p-4 bg-muted/30 rounded-xl">
                Refund processing timeline: 5–10 business days. Insurance fees refundable only as per insurer terms.
              </p>
            </motion.section>

            {/* Wallet Refund & Account Deletion */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Wallet className="h-6 w-6 text-coke-red" />
                Wallet Refund &amp; Account Deletion
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All refunds are credited to the CourierX™ wallet only and not to the original payment source.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If a user permanently deletes their account, any remaining wallet balance (excluding promotional credits) shall be refunded to the original payment method or verified bank account after identity verification.
              </p>
              <p className="text-muted-foreground leading-relaxed p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <strong className="text-amber-600 dark:text-amber-400">Note:</strong> CourierX™ reserves the right to withhold withdrawals in cases of fraud, disputes, or regulatory investigation.
              </p>
            </motion.section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default RefundPolicy;
