"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { Shield, Lock, Eye, Database, Share2, Bell, UserCheck, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
              <Shield className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Privacy Policy</h1>
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
                <Shield className="h-6 w-6 text-coke-red" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                CourierX (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains in detail what information we collect, why we collect it, how we use it, with whom we share it, and the security measures we employ to protect it. By using our international courier services and website, you consent to the practices described in this policy.
              </p>
            </motion.section>

            {/* Types of Personal Information Collected */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-coke-red" />
                1. Types of Personal Information Collected
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect various types of personal information to provide and improve our courier services:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Identity Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Full legal name as per government ID</li>
                    <li>Date of birth</li>
                    <li>Gender</li>
                    <li>Photograph (for KYC verification)</li>
                    <li>Government-issued ID numbers (Aadhaar, PAN, Passport)</li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Contact Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Email address</li>
                    <li>Mobile phone number and WhatsApp number</li>
                    <li>Residential address</li>
                    <li>Shipping and billing addresses</li>
                    <li>Emergency contact details</li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Shipment Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Package contents description and category</li>
                    <li>Package weight, dimensions, and declared value</li>
                    <li>Sender and recipient details</li>
                    <li>Customs declarations and documentation</li>
                    <li>Prescription details (for medicine shipments)</li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Technical Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>IP address and device identifiers</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Login timestamps and session data</li>
                    <li>Cookies and tracking technologies</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Purpose of Collection */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Eye className="h-6 w-6 text-coke-red" />
                2. Purpose of Information Collection
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect and process your personal information for the following specific purposes:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  <span><strong className="text-foreground">Service Delivery:</strong> To process, fulfill, and track your international shipments from pickup to delivery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  <span><strong className="text-foreground">Identity Verification:</strong> To verify your identity for KYC compliance as required under CSB-IV regulations for international shipping</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                  <span><strong className="text-foreground">Communication:</strong> To send shipment updates, delivery notifications, and important service announcements via SMS, email, and WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                  <span><strong className="text-foreground">Payment Processing:</strong> To process payments securely and prevent fraudulent transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                  <span><strong className="text-foreground">Legal Compliance:</strong> To comply with customs regulations, export laws, and government requirements</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">6</span>
                  <span><strong className="text-foreground">Service Improvement:</strong> To analyze usage patterns and improve our platform and services</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-coke-red/10 text-coke-red flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">7</span>
                  <span><strong className="text-foreground">Customer Support:</strong> To respond to your inquiries, complaints, and provide assistance</span>
                </li>
              </ul>
            </motion.section>

            {/* Information Sharing */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Share2 className="h-6 w-6 text-coke-red" />
                3. With Whom We Share Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We share your personal information only with trusted parties necessary for service delivery:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Courier Partners</h3>
                  <p className="text-muted-foreground text-sm">DHL, FedEx, Aramex, and other logistics partners who physically transport your shipments</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Payment Processors</h3>
                  <p className="text-muted-foreground text-sm">Razorpay, PayU, and banking partners for secure payment processing</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Government Authorities</h3>
                  <p className="text-muted-foreground text-sm">Customs departments, regulatory bodies, and law enforcement as required by law</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Service Providers</h3>
                  <p className="text-muted-foreground text-sm">Cloud hosting (AWS), SMS/email services, and customer support tools</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mt-4 p-4 bg-coke-red/5 rounded-xl border border-coke-red/20">
                <strong className="text-coke-red">Important:</strong> We never sell your personal information to third parties for marketing purposes. All data sharing is strictly for service delivery and legal compliance.
              </p>
            </motion.section>

            {/* Data Security */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-coke-red" />
                4. Security Measures for Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-candlestick-green/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-candlestick-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">SSL/TLS Encryption</h3>
                    <p className="text-muted-foreground text-sm">All data transmitted between your browser and our servers is encrypted using 256-bit SSL encryption</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-candlestick-green/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-candlestick-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">PCI-DSS Compliance</h3>
                    <p className="text-muted-foreground text-sm">Our payment processing is fully PCI-DSS compliant. We do not store your complete card details on our servers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-candlestick-green/10 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-candlestick-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Secure Data Storage</h3>
                    <p className="text-muted-foreground text-sm">Data is stored on encrypted servers with regular security audits and access controls</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-candlestick-green/10 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-5 w-5 text-candlestick-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Access Controls</h3>
                    <p className="text-muted-foreground text-sm">Strict role-based access ensures only authorized personnel can access your data</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Card Details Security */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-coke-red" />
                5. Payment Card Information Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you make payments on CourierX, your card information is handled with the highest level of security:
              </p>
              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Why We Collect Card Details</h3>
                  <p className="text-muted-foreground text-sm">Card details are collected solely for processing payments for shipping services. We use trusted payment gateways (Razorpay, PayU) to handle transactions.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Collection Security</h3>
                  <p className="text-muted-foreground text-sm">Card information is entered directly on PCI-DSS compliant payment gateway pages. Your full card number never touches our servers.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Storage Policy</h3>
                  <p className="text-muted-foreground text-sm">We only store masked card numbers (last 4 digits) and card type for your reference. Full card details are never stored on our systems.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Transmission Security</h3>
                  <p className="text-muted-foreground text-sm">All payment data is transmitted using TLS 1.3 encryption, ensuring your information cannot be intercepted during transmission.</p>
                </div>
              </div>
            </motion.section>

            {/* Your Rights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4 flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-coke-red" />
                6. Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Right to Access:</strong> Request a copy of all personal data we hold about you</li>
                <li><strong className="text-foreground">Right to Correction:</strong> Request correction of any inaccurate or incomplete information</li>
                <li><strong className="text-foreground">Right to Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong className="text-foreground">Right to Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong className="text-foreground">Right to Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
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
                7. Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For any privacy-related inquiries, concerns, or to exercise your rights, please contact our Data Protection Officer:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-foreground font-semibold">CourierX Pvt. Ltd.</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    123 Business Park, Sector 15<br />
                    Gurugram, Haryana 122001<br />
                    India
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    <strong className="text-foreground">Email:</strong> privacy@courierx.in<br />
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

export default PrivacyPolicy;
