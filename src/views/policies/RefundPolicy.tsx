"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { RotateCcw, Clock, XCircle, CheckCircle, AlertTriangle, CreditCard, Mail, Package } from 'lucide-react';
import { motion } from 'framer-motion';

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
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Refund & Cancellation Policy</h1>
            <p className="text-muted-foreground">Last updated: January 6, 2026</p>
          </motion.div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            {/* Introduction */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <RotateCcw className="h-6 w-6 text-coke-red" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At CourierX, we strive to provide reliable international shipping services. We understand that circumstances may require you to cancel a shipment or request a refund. This policy outlines the terms, conditions, and procedures for cancellations and refunds to ensure transparency and fairness for all our customers.
              </p>
            </motion.section>

            {/* Cancellation Terms */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-coke-red" />
                1. Cancellation Terms & Duration
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may cancel your shipment booking under the following conditions:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-4 text-foreground font-semibold">Cancellation Window</th>
                      <th className="text-left py-4 px-4 text-foreground font-semibold">Refund Amount</th>
                      <th className="text-left py-4 px-4 text-foreground font-semibold">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Within 1 hour of booking</td>
                      <td className="py-4 px-4 text-candlestick-green font-semibold">100% refund</td>
                      <td className="py-4 px-4">Instant</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">1-24 hours before scheduled pickup</td>
                      <td className="py-4 px-4 text-candlestick-green font-semibold">90% refund</td>
                      <td className="py-4 px-4">3-5 business days</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">After pickup is scheduled (before pickup)</td>
                      <td className="py-4 px-4 text-amber-500 font-semibold">75% refund</td>
                      <td className="py-4 px-4">5-7 business days</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4">After pickup is completed</td>
                      <td className="py-4 px-4 text-coke-red font-semibold">No refund</td>
                      <td className="py-4 px-4">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="text-muted-foreground text-sm mt-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <strong className="text-amber-600 dark:text-amber-400">Note:</strong> Cancellation charges cover operational costs including pickup scheduling, documentation preparation, and carrier coordination.
              </p>
            </motion.section>

            {/* How to Request Cancellation/Refund */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Package className="h-6 w-6 text-coke-red" />
                2. How to Request Cancellation or Refund
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Follow these steps to cancel your shipment or request a refund:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-coke-red text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Login to Your Account</h3>
                    <p className="text-muted-foreground text-sm">Access your CourierX dashboard at courierx.in/dashboard</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-coke-red text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Navigate to Shipment History</h3>
                    <p className="text-muted-foreground text-sm">Find the shipment you wish to cancel and click on it</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-coke-red text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Click &quot;Request Cancellation&quot;</h3>
                    <p className="text-muted-foreground text-sm">Select the reason for cancellation from the dropdown menu</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-coke-red text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Confirm & Submit</h3>
                    <p className="text-muted-foreground text-sm">Review the refund amount and confirm your cancellation request</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-coke-red text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Receive Confirmation</h3>
                    <p className="text-muted-foreground text-sm">You&apos;ll receive an email and SMS confirmation with refund details</p>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mt-4">
                <strong>Alternative:</strong> You can also request cancellation by emailing <span className="text-coke-red">refunds@courierx.in</span> or calling <span className="text-coke-red">+91 124 456 7890</span> with your tracking number.
              </p>
            </motion.section>

            {/* Refund Scenarios */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-coke-red" />
                3. Refund Scenarios & Processing Time
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Refunds are processed based on the following scenarios:
              </p>
              
              <div className="space-y-4">
                <div className="bg-candlestick-green/10 border border-candlestick-green/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-candlestick-green" />
                    Full Refund Scenarios
                  </h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Cancellation within 1 hour of booking</li>
                    <li>Pickup not completed within 48 hours of scheduled time (our fault)</li>
                    <li>Shipment lost in transit (with declared value compensation)</li>
                    <li>Service unavailable to destination after booking</li>
                    <li>Duplicate payment charged</li>
                  </ul>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Partial Refund Scenarios
                  </h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Cancellation after 1 hour but before pickup (75-90% refund)</li>
                    <li>Shipment returned due to incorrect recipient address (shipping cost deducted)</li>
                    <li>Package damaged in transit (based on insurance coverage)</li>
                    <li>Delivery delayed beyond guaranteed time (partial compensation)</li>
                  </ul>
                </div>
                
                <div className="bg-coke-red/10 border border-coke-red/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-coke-red" />
                    No Refund Scenarios
                  </h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Cancellation after pickup is completed</li>
                    <li>Shipment seized by customs due to prohibited items</li>
                    <li>Incorrect/incomplete sender information provided</li>
                    <li>Recipient refused delivery after 3 attempts</li>
                    <li>Force majeure events (natural disasters, strikes, etc.)</li>
                    <li>Shipment successfully delivered</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">Refund Processing Timeline</h3>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• <strong>Review Period:</strong> 2-3 business days</li>
                  <li>• <strong>Approval Notification:</strong> Via email and SMS</li>
                  <li>• <strong>Refund Processing:</strong> 5-7 business days after approval</li>
                  <li>• <strong>Bank Credit:</strong> Additional 3-5 days depending on your bank</li>
                </ul>
              </div>
            </motion.section>

            {/* Returns & Exchange */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <RotateCcw className="h-6 w-6 text-coke-red" />
                4. Returns & Exchange Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As a courier service, we facilitate shipping but do not sell physical products. However, the following applies to shipment returns:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Return Shipment Instructions</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>If recipient refuses delivery, package will be returned to sender</li>
                    <li>Return shipping charges apply and will be deducted from any refund</li>
                    <li>Returns must be initiated within 7 days of delivery attempt</li>
                    <li>Original packaging must be intact for return processing</li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Conditions for Return Acceptance</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Package must not have been opened or tampered with</li>
                    <li>All original documentation must be present</li>
                    <li>Customs clearance must not have been completed</li>
                    <li>Return request must be made through official channels</li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Non-Returnable Shipments</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 text-sm">
                    <li>Perishable items or temperature-sensitive medicines</li>
                    <li>Shipments that have cleared customs in destination country</li>
                    <li>Documents that have been delivered and signed for</li>
                    <li>Items prohibited for return by destination country laws</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Refund Methods */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-coke-red" />
                5. Refund Methods
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Refunds are processed through the following methods based on your original payment:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Credit/Debit Card</h3>
                  <p className="text-muted-foreground text-sm">Refunded to original card within 5-7 business days. May take additional 3-5 days to reflect in statement.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">UPI</h3>
                  <p className="text-muted-foreground text-sm">Refunded to original UPI ID within 24-48 hours after approval.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Net Banking</h3>
                  <p className="text-muted-foreground text-sm">Refunded to original bank account via NEFT/IMPS within 3-5 business days.</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">CourierX Wallet</h3>
                  <p className="text-muted-foreground text-sm">Instant credit to your CourierX wallet for future shipments (optional).</p>
                </div>
              </div>
            </motion.section>

            {/* Dispute Resolution */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-coke-red" />
                6. Dispute Resolution
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you disagree with our refund decision, you may escalate the matter:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Email <span className="text-coke-red">escalations@courierx.in</span> within 7 days of refund decision</li>
                <li>Include your tracking number, original complaint reference, and reason for dispute</li>
                <li>Our escalation team will review within 5 business days</li>
                <li>Final decision will be communicated via email with detailed explanation</li>
                <li>All disputes are resolved within 15 business days</li>
              </ul>
            </motion.section>

            {/* Contact */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-coke-red/5 border border-coke-red/20 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Mail className="h-6 w-6 text-coke-red" />
                7. Contact for Refunds
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-foreground font-semibold">CourierX Refunds Team</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    123 Business Park, Sector 15<br />
                    Gurugram, Haryana 122001<br />
                    India
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Email:</strong> refunds@courierx.in<br />
                    <strong className="text-foreground">Phone:</strong> +91 124 456 7890<br />
                    <strong className="text-foreground">Hours:</strong> Mon-Sat, 9 AM - 8 PM IST
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default RefundPolicy;
