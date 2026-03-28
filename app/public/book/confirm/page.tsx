"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, UserPlus, Package } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface GuestBookingData {
  guestInfo: { fullName: string; email: string; phone: string };
  packageInfo: { weightGrams: number; declaredValue: number; destinationCountry: string; contentDescription: string };
  category: string;
  selectedCourier: { carrier: string; price: number; serviceName: string; transitDays: { min: number; max: number } };
  createdAt: string;
}

export default function GuestBookingConfirmPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<GuestBookingData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('guestBooking');
    if (stored) {
      setBooking(JSON.parse(stored));
    } else {
      router.replace('/public/book');
    }
  }, [router]);

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img alt="CourierX" src="/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png" className="h-9 w-auto object-contain" />
          </Link>
        </div>
      </header>

      <main className="container max-w-lg py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-xl border border-border p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-candlestick-green/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-candlestick-green" weight="fill" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Booking Received</h1>
            <p className="text-muted-foreground mt-2">
              Your {booking.category} shipment request has been submitted. Our team will contact you at{' '}
              <span className="font-medium text-foreground">{booking.guestInfo.email}</span> with payment details and next steps.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Courier</span>
              <span className="font-medium">{booking.selectedCourier.carrier} ({booking.selectedCourier.serviceName})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Price</span>
              <span className="font-bold text-lg">₹{booking.selectedCourier.price.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{booking.selectedCourier.transitDays.min}–{booking.selectedCourier.transitDays.max} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{booking.guestInfo.fullName}</span>
            </div>
          </div>

          <div className="rounded-xl border border-candlestick-green/30 bg-candlestick-green/5 p-4 text-left">
            <p className="text-sm">
              <span className="font-semibold">Want lower rates next time?</span> Open a free account to save 52% on every shipment.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-1.5"
              onClick={() => router.push('/open-account')}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Open Account
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
              Back to Home
            </Button>
            <Button className="flex-1 bg-coke-red hover:bg-red-600 text-white gap-1.5" onClick={() => router.push('/public/book')}>
              <Package className="h-4 w-4" />
              Ship Another
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
