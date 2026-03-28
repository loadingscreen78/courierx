"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pill, FileText, Gift, ArrowLeft, UserPlus, Truck } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const shipmentTypes = [
  {
    id: 'medicine',
    title: 'Medicine',
    description: 'Prescription medicines with documentation (CSB-IV compliant)',
    icon: Pill,
    href: '/public/book/medicine',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'hover:border-red-300 dark:hover:border-red-800',
  },
  {
    id: 'document',
    title: 'Document',
    description: 'Important documents, certificates, and paperwork',
    icon: FileText,
    href: '/public/book/document',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'hover:border-blue-300 dark:hover:border-blue-800',
  },
  {
    id: 'gift',
    title: 'Gift / Personal',
    description: 'Personal gifts, clothing, food items, and more',
    icon: Gift,
    href: '/public/book/gift',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'hover:border-purple-300 dark:hover:border-purple-800',
  },
  {
    id: 'domestic',
    title: 'Domestic',
    description: 'Ship within India — documents and gifts',
    icon: Truck,
    href: '/public/book/domestic',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'hover:border-green-300 dark:hover:border-green-800',
  },
];

export default function PublicBookPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              alt="CourierX"
              src="/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/auth')} className="rounded-xl text-sm">
              Sign In
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/open-account')} className="rounded-xl text-sm gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Open Account — Save 52%
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">What are you shipping?</h1>
            <p className="text-muted-foreground text-sm">No account needed. Choose your shipment type to get started.</p>
          </div>
        </div>

        {/* Account savings banner */}
        <div className="rounded-xl border border-candlestick-green/30 bg-candlestick-green/5 p-4 flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-candlestick-green shrink-0" />
          <p className="text-sm">
            <span className="font-medium">Save 52% on every shipment</span> by opening a free account with Aadhaar verification.{' '}
            <button onClick={() => router.push('/open-account')} className="text-coke-red hover:underline font-medium">
              Open Account →
            </button>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {shipmentTypes.map((type, i) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => router.push(type.href)}
              className={`text-left p-6 rounded-xl border border-border ${type.borderColor} transition-all duration-200 hover:shadow-md group`}
            >
              <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center mb-4`}>
                <type.icon className={`h-6 w-6 ${type.color}`} weight="duotone" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{type.title}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
