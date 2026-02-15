"use client";

import { useState, useEffect } from 'react';
import { Menu, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingHeader = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Track Shipment', href: '/public/track' },
    { label: 'Rate Calculator', href: '/public/rate-calculator' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-lg shadow-sm border-b border-border' 
          : 'bg-transparent'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <img
                alt="CourierX"
                src="/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png"
                className="h-10 w-auto object-contain rounded-none"
              />
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <button
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coke-red transition-all duration-300 group-hover:w-full" />
                </button>
              </motion.div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="hidden md:flex items-center gap-3"
          >
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => router.push('/auth')}
              className="hover:bg-primary/5"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/auth?panel=customer')}
              className="gap-2 bg-coke-red hover:bg-coke-red/90 shadow-md shadow-coke-red/20 transition-all duration-300 hover:shadow-lg hover:shadow-coke-red/30"
            >
              <Package className="h-4 w-4" />
              Start Shipping
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-lg"
            >
              <nav className="flex flex-col gap-1 py-4">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={(e) => {
                        handleNavClick(e, link.href);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                      {link.label}
                    </button>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-2 px-4 pt-4 border-t border-border mt-2"
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      router.push('/auth');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="flex-1 bg-coke-red hover:bg-coke-red/90"
                    onClick={() => {
                      router.push('/auth?panel=customer');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
