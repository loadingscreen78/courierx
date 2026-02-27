"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { UserCheck, FileText, Pill, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionClass = "bg-card border border-border rounded-2xl p-8";
const h2Class = "text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3";

const KycPolicy = () => {
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
              <UserCheck className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">KYC &amp; Verification Policy</h1>
            <p className="text-muted-foreground">Effective Date: 23rd February 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionClass}>
              <h2 className={h2Class}>
                <UserCheck className="h-6 w-6 text-coke-red" />
                Why KYC is Required
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To comply with customs and export laws, CourierX™ requires identity verification.
              </p>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionClass}>
              <h2 className={h2Class}>
                <FileText className="h-6 w-6 text-coke-red" />
                Required Documents
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>PAN</li>
                <li>Aadhaar</li>
                <li>Passport (for international shipments)</li>
              </ul>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Pill className="h-6 w-6 text-coke-red" />
                For Medicine Shipments
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Valid prescription</li>
                <li>Supporting invoice</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                CourierX™ may request additional documents where necessary.
              </p>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-coke-red/5 border border-coke-red/20 rounded-2xl p-8">
              <h2 className={h2Class}>
                <Clock className="h-6 w-6 text-coke-red" />
                Document Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                KYC documents are retained until regulatory audit closure.
              </p>
            </motion.section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default KycPolicy;
