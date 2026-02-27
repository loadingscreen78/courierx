"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { Database, Clock, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionClass = "bg-card border border-border rounded-2xl p-8";
const h2Class = "text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3";

const DataRetentionPolicy = () => {
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
              <Database className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Data Retention &amp; Disclosure Policy</h1>
            <p className="text-muted-foreground">Effective Date: 23rd February 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Database className="h-6 w-6 text-coke-red" />
                What We Retain
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">CourierX™ retains:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Identity documents</li>
                <li>Shipment records</li>
                <li>Prescription copies</li>
                <li>Transaction logs</li>
              </ul>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Clock className="h-6 w-6 text-coke-red" />
                Retention Period
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Until regulatory audit closure</li>
                <li>Or as mandated by law</li>
              </ul>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-coke-red/5 border border-coke-red/20 rounded-2xl p-8">
              <h2 className={h2Class}>
                <Share2 className="h-6 w-6 text-coke-red" />
                Data Disclosure
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Data may be disclosed:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Under court order</li>
                <li>To customs authorities</li>
                <li>To regulatory agencies</li>
                <li>For suspicious transaction reporting</li>
              </ul>
            </motion.section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default DataRetentionPolicy;
