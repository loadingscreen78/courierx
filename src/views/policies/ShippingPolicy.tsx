"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { Truck, Globe, Shield, Package, AlertTriangle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionClass = "bg-card border border-border rounded-2xl p-8";
const h2Class = "text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3";

const ShippingPolicy = () => {
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
              <Truck className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Shipping &amp; Compliance Policy</h1>
            <p className="text-muted-foreground">Effective Date: 23rd February 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            {/* Platform Nature */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Globe className="h-6 w-6 text-coke-red" />
                Platform Nature
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                CourierX™ operates as an intermediary platform. Users are Shippers of Record.
              </p>
            </motion.section>

            {/* CSB-IV Personal Shipments */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionClass}>
              <h2 className={h2Class}>
                <Package className="h-6 w-6 text-coke-red" />
                CSB-IV Personal Shipments
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">For CSB-IV personal shipments:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Max declared value: ₹25,000</li>
                <li>Max medicine supply: 90 days</li>
                <li>Valid prescription mandatory</li>
                <li>Max shipment weight: 68 kg</li>
              </ul>
            </motion.section>

            {/* Customs & Duties */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={sectionClass}>
              <h2 className={h2Class}>
                <AlertTriangle className="h-6 w-6 text-coke-red" />
                Customs &amp; Duties
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CourierX™ does not guarantee customs clearance.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Duties and taxes imposed by destination authorities are the responsibility of the recipient unless prepaid.
              </p>
            </motion.section>

            {/* Carrier Liability */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-coke-red/5 border border-coke-red/20 rounded-2xl p-8">
              <h2 className={h2Class}>
                <Scale className="h-6 w-6 text-coke-red" />
                Carrier Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Carrier liability remains subject to respective courier policies.
              </p>
            </motion.section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ShippingPolicy;
