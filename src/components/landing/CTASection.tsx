"use client";

import { ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

const contactOptions = [
  {
    icon: Phone,
    title: 'East India',
    subtitle: '+91 7008368628',
    href: 'tel:+917008368628',
    iconBg: 'bg-paper-white/10',
  },
  {
    icon: Phone,
    title: 'West India',
    subtitle: '+91 8484050057',
    href: 'tel:+918484050057',
    iconBg: 'bg-paper-white/10',
  },
  {
    icon: Mail,
    title: 'Email Support',
    subtitle: 'info@courierx.in',
    href: 'mailto:info@courierx.in',
    iconBg: 'bg-paper-white/10',
  },
];

export const CTASection = () => {
  const router = useRouter();

  return (
    <section className="py-24">
      <div className="container">
        <AnimatedSection>
          <div 
            className="relative overflow-hidden rounded-3xl p-8 md:p-16 border border-white/20 dark:border-white/10 metallic-light dark:metallic-dark"
          >
            {/* Metallic Shine Overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.4) 50%, transparent 55%)',
              }}
            />
            
            {/* Brushed Metal Texture */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
              }}
            />
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-10 dark:opacity-10">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                  scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full border border-primary/20 dark:border-paper-white/20"
              />
              <motion.div
                animate={{ 
                  rotate: -360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 45, repeat: Infinity, ease: "linear" },
                  scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full border border-primary/10 dark:border-paper-white/10"
              />
            </div>

            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-coke-red/10 dark:bg-coke-red/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold font-typewriter leading-tight text-foreground"
                >
                  Ready to Ship?
                  <br />
                  <span className="text-coke-red">Get Started Today</span>
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-muted-foreground text-lg leading-relaxed"
                >
                  Join thousands of Indians who trust CourierX for their international shipping needs. 
                  Sign up now and get your first shipment quote in minutes.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button 
                    size="lg" 
                    className="group gap-2 bg-coke-red hover:bg-coke-red/90 text-white shadow-lg shadow-coke-red/30 transition-all duration-300 hover:shadow-xl hover:shadow-coke-red/40"
                    onClick={() => router.push('/auth?panel=customer')}
                  >
                    Create Account
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-border text-foreground hover:bg-accent transition-all duration-300"
                    onClick={() => router.push('/public/rate-calculator')}
                  >
                    Calculate Rates
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.h3
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-xl font-semibold text-foreground"
                >
                  Need Help?
                </motion.h3>
                <div className="space-y-3">
                  {contactOptions.map((option, index) => (
                    <motion.a
                      key={option.title}
                      href={option.href}
                      target={option.href.startsWith('http') ? '_blank' : undefined}
                      rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-background/50 dark:bg-paper-white/5 border border-border/50 hover:bg-coke-red/10 dark:hover:bg-paper-white/10 hover:border-coke-red/30 dark:hover:border-paper-white/20 transition-all duration-150"
                    >
                      <div className="w-12 h-12 rounded-full bg-coke-red/10 dark:bg-paper-white/10 flex items-center justify-center">
                        <option.icon className="h-5 w-5 text-coke-red dark:text-paper-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground dark:text-paper-white">{option.title}</p>
                        <p className="text-sm text-muted-foreground dark:text-paper-white/60">{option.subtitle}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
