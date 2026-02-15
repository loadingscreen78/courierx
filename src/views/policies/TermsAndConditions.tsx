"use client";

import { LandingHeader, LandingFooter } from '@/components/landing';
import { FileText } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coke-red/10 text-coke-red mb-4">
              <FileText className="h-5 w-5" />
              <span className="font-semibold text-sm">Legal</span>
            </div>
            <h1 className="text-4xl font-bold font-typewriter text-foreground mb-4">Terms & Conditions</h1>
            <p className="text-muted-foreground">Last updated: January 4, 2026</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using CourierX services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. These terms constitute a legally binding agreement between you and CourierX.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">2. Services Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CourierX is an international courier aggregator platform that provides:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>International shipping services for medicines, documents, and personal gifts</li>
                <li>CSB-IV compliant pharmaceutical shipments from India</li>
                <li>Real-time shipment tracking and notifications</li>
                <li>Secure online payment processing</li>
                <li>Customer support and assistance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">3. User Eligibility</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>You must be at least 18 years old to use our services</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You must comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">4. User Obligations</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide accurate shipment details and declarations</li>
                <li>Ensure packages comply with prohibited items list</li>
                <li>Maintain valid prescriptions for medicine shipments</li>
                <li>Pay all applicable fees, duties, and taxes</li>
                <li>Not use services for illegal or fraudulent purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">5. Payment Terms</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All prices are in Indian Rupees (INR) unless otherwise stated</li>
                <li>Payment must be made in full before shipment pickup</li>
                <li>We accept Credit/Debit Cards, UPI, Net Banking, and Wallet payments</li>
                <li>All transactions are processed through secure payment gateways</li>
                <li>Additional customs duties are the responsibility of the recipient</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">6. Shipping & Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                Delivery timeframes are estimates and not guaranteed. CourierX is not liable for delays caused by customs clearance, weather conditions, carrier issues, or other circumstances beyond our control. Please refer to our Shipping Policy for detailed information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">7. Limitation of Liability</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maximum liability is limited to declared shipment value or insurance coverage</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>We are not responsible for customs seizures due to prohibited items</li>
                <li>Force majeure events release us from liability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, trademarks, logos, and intellectual property on the CourierX platform are owned by or licensed to CourierX. You may not use, reproduce, or distribute any content without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">9. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of our services is also governed by our Privacy Policy. By using CourierX, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these terms, fraudulent activity, or any other reason at our sole discretion. Upon termination, your right to use our services ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Gurugram, Haryana, India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-typewriter text-foreground mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms & Conditions:<br />
                Email: legal@courierx.in<br />
                Phone: +91 124 456 7890<br />
                Address: 123 Business Park, Sector 15, Gurugram, Haryana 122001
              </p>
            </section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default TermsAndConditions;
