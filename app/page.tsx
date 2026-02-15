"use client";

import { useState, useEffect } from 'react';
import {
  LandingHeader,
  LandingFooter,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
} from '@/components/landing';
import { AppLoader } from '@/components/ui/AppLoader';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loader long enough to see the full animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div suppressHydrationWarning>
      <AppLoader isLoading={isLoading} />
      <div className="min-h-screen flex flex-col bg-background">
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
    </div>
  );
}
