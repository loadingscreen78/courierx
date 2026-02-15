import { useState, useEffect } from 'react';
import { useSeo } from '@/hooks/useSeo';
import {
  LandingHeader,
  LandingFooter,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
  WelcomeLoader,
} from '@/components/landing';

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useSeo({
    title: 'CourierX - International Shipping from India | Medicines, Documents & Gifts',
    description: 'Ship medicines, documents, and gifts internationally from India. CSB-IV compliant, fast delivery to 150+ countries. Compare DHL, FedEx, Aramex rates.',
    canonicalPath: '/',
  });

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasVisited = sessionStorage.getItem('courierx-visited');
    
    if (hasVisited) {
      setIsLoading(false);
    } else {
      // Show loader for first-time visitors
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('courierx-visited', 'true');
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <WelcomeLoader isLoading={isLoading} />
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        <main className="flex-1">
          <HeroSection />
          <section id="features">
            <FeaturesSection />
          </section>
          <HowItWorksSection />
          <TestimonialsSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

export default LandingPage;
