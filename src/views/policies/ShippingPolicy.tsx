"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { Truck, Clock, Globe, Package, Plane, AlertTriangle, Shield, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Shipping Policy</h1>
            <p className="text-muted-foreground">Last updated: January 4, 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">1. Service Coverage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CourierX provides international shipping services from India to 150+ countries worldwide. We specialize in:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Medicines:</strong> CSB-IV compliant pharmaceutical shipments</li>
                <li><strong>Documents:</strong> Legal, educational, and business documents</li>
                <li><strong>Personal Gifts:</strong> Non-commercial items for personal use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">2. Delivery Timeframes</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-foreground font-semibold">Region</th>
                      <th className="text-left py-3 px-4 text-foreground font-semibold">Standard</th>
                      <th className="text-left py-3 px-4 text-foreground font-semibold">Express</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border"><td className="py-3 px-4">USA, UK, Europe</td><td className="py-3 px-4">5-7 days</td><td className="py-3 px-4">3-4 days</td></tr>
                    <tr className="border-b border-border"><td className="py-3 px-4">Middle East, UAE</td><td className="py-3 px-4">4-6 days</td><td className="py-3 px-4">2-3 days</td></tr>
                    <tr className="border-b border-border"><td className="py-3 px-4">Australia, NZ</td><td className="py-3 px-4">6-8 days</td><td className="py-3 px-4">4-5 days</td></tr>
                    <tr className="border-b border-border"><td className="py-3 px-4">Southeast Asia</td><td className="py-3 px-4">4-5 days</td><td className="py-3 px-4">2-3 days</td></tr>
                    <tr><td className="py-3 px-4">Africa, South America</td><td className="py-3 px-4">7-10 days</td><td className="py-3 px-4">5-6 days</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">*Delivery times are estimates and may vary due to customs clearance.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">3. Pickup Process</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Schedule pickup during booking (same-day or next-day available)</li>
                <li>Pickup window: 10 AM - 7 PM (Mon-Sat)</li>
                <li>Ensure package is properly packed and labeled</li>
                <li>Keep ID proof ready for verification</li>
                <li>Receive pickup confirmation via SMS/Email</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">4. Prohibited Items</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">The following items cannot be shipped:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Narcotics and controlled substances</li>
                <li>Weapons, ammunition, and explosives</li>
                <li>Hazardous materials and flammable goods</li>
                <li>Counterfeit products and pirated goods</li>
                <li>Currency, precious metals, and jewelry</li>
                <li>Live animals and perishable food items</li>
                <li>Items prohibited by destination country laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">5. Packaging Requirements</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use sturdy corrugated boxes for all shipments</li>
                <li>Medicines must be in original packaging with prescription</li>
                <li>Documents should be in waterproof sleeves</li>
                <li>Fragile items require bubble wrap and &quot;Fragile&quot; labels</li>
                <li>Maximum weight: 30 kg per package</li>
                <li>Maximum dimensions: 120cm x 80cm x 80cm</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">6. Insurance Coverage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All shipments include basic insurance coverage up to ₹5,000. Additional coverage options:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Standard:</strong> Up to ₹25,000 (1% of declared value)</li>
                <li><strong>Premium:</strong> Up to ₹1,00,000 (1.5% of declared value)</li>
                <li><strong>Comprehensive:</strong> Full declared value (2% of declared value)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">7. Customs & Duties</h2>
              <p className="text-muted-foreground leading-relaxed">
                Import duties and taxes are the responsibility of the recipient. CourierX provides all necessary customs documentation. Shipments may be held for customs inspection. We recommend accurate declaration of contents and value to avoid delays.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">8. Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                CourierX liability is limited to the declared value or insurance coverage, whichever is lower. We are not liable for delays due to customs, weather, or other circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For shipping inquiries:<br />
                Email: shipping@courierx.in<br />
                Phone: +91 124 456 7890<br />
                Support Hours: Mon-Sat, 9 AM - 8 PM IST
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ShippingPolicy;
