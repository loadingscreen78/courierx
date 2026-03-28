"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CircleNotch, UserPlus, Package, Pill, FileText, Gift, Truck, User, Envelope, Phone } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCourierOptions } from '@/lib/shipping/rateCalculator';
import { getServedCountries } from '@/lib/shipping/countries';
import Link from 'next/link';
import { motion } from 'framer-motion';

type ShipmentCategory = 'medicine' | 'document' | 'gift' | 'domestic';

interface PublicBookingFlowProps {
  category: ShipmentCategory;
}

const categoryConfig: Record<ShipmentCategory, { title: string; description: string; icon: typeof Pill }> = {
  medicine: { title: 'Ship Medicine', description: 'Prescription medicines — CSB-IV compliant', icon: Pill },
  document: { title: 'Ship Document', description: 'Important documents and paperwork', icon: FileText },
  gift: { title: 'Ship Gift / Personal', description: 'Personal gifts, clothing, food items', icon: Gift },
  domestic: { title: 'Ship Domestic', description: 'Ship within India', icon: Truck },
};

const guestInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Valid Indian phone number required'),
});

const packageSchema = z.object({
  weightGrams: z.coerce.number().min(100, 'Min 100g').max(30000, 'Max 30kg'),
  lengthCm: z.coerce.number().min(1).max(150),
  widthCm: z.coerce.number().min(1).max(150),
  heightCm: z.coerce.number().min(1).max(150),
  declaredValue: z.coerce.number().min(1, 'Required').max(50000),
  contentDescription: z.string().min(3, 'Describe contents'),
  destinationCountry: z.string().min(2, 'Select destination'),
});

type GuestInfo = z.infer<typeof guestInfoSchema>;
type PackageInfo = z.infer<typeof packageSchema>;

export default function PublicBookingFlow({ category }: PublicBookingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const config = categoryConfig[category];
  const [step, setStep] = useState(1); // 1=guest info, 2=package, 3=rates
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDomestic = category === 'domestic';
  const countries = getServedCountries();

  const guestForm = useForm<GuestInfo>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: { fullName: '', email: '', phone: '' },
  });

  const packageForm = useForm<PackageInfo>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      weightGrams: 500,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      declaredValue: 1000,
      contentDescription: '',
      destinationCountry: '',
    },
  });

  const handleGuestSubmit = (values: GuestInfo) => {
    setGuestInfo(values);
    setStep(2);
  };

  const handlePackageSubmit = (values: PackageInfo) => {
    setPackageInfo(values);
    setStep(3);
  };

  // Get courier options with guest markup
  const courierOptions = packageInfo && !isDomestic
    ? getCourierOptions({
        destinationCountryCode: packageInfo.destinationCountry,
        shipmentType: category as 'medicine' | 'document' | 'gift',
        weightGrams: packageInfo.weightGrams,
        dimensions: { length: packageInfo.lengthCm, width: packageInfo.widthCm, height: packageInfo.heightCm },
        declaredValue: packageInfo.declaredValue,
      }, true) // isGuest = true → 52% markup
    : [];

  // Calculate what account holders would pay (for comparison)
  const accountOptions = packageInfo && !isDomestic
    ? getCourierOptions({
        destinationCountryCode: packageInfo.destinationCountry,
        shipmentType: category as 'medicine' | 'document' | 'gift',
        weightGrams: packageInfo.weightGrams,
        dimensions: { length: packageInfo.lengthCm, width: packageInfo.widthCm, height: packageInfo.heightCm },
        declaredValue: packageInfo.declaredValue,
      }, false) // isGuest = false → account holder price
    : [];

  const handleSelectCourier = async (carrierIndex: number) => {
    if (!guestInfo || !packageInfo) return;
    setIsLoading(true);

    try {
      const selected = courierOptions[carrierIndex];
      // Store guest booking data in localStorage for payment flow
      const bookingData = {
        guestInfo,
        packageInfo,
        category,
        selectedCourier: selected,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('guestBooking', JSON.stringify(bookingData));

      toast({
        title: 'Booking Initiated',
        description: `${selected.carrier} — ₹${selected.price.toLocaleString('en-IN')}. Redirecting to payment...`,
      });

      // For now, redirect to a confirmation page
      // In production, this would go to Cashfree payment
      router.push('/public/book/confirm');
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img alt="CourierX" src="/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/open-account')} className="rounded-xl text-sm gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Open Account — Save 52%
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 space-y-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : router.push('/public/book')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <config.icon className="h-6 w-6 text-coke-red" weight="duotone" />
              {config.title}
            </h1>
            <p className="text-muted-foreground text-sm">{config.description} — Guest booking (standard rates)</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-coke-red' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Guest Info */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Your Details</h2>
            <p className="text-sm text-muted-foreground">We need your contact info for shipment updates and customs documentation.</p>

            <Form {...guestForm}>
              <form onSubmit={guestForm.handleSubmit(handleGuestSubmit)} className="space-y-4">
                <FormField control={guestForm.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="Your full name" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={guestForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="you@example.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={guestForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="+91 98765 43210" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-coke-red hover:bg-red-600 text-white gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {/* Step 2: Package Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Package Details</h2>

            <Form {...packageForm}>
              <form onSubmit={packageForm.handleSubmit(handlePackageSubmit)} className="space-y-4">
                {!isDomestic && (
                  <FormField control={packageForm.control} name="destinationCountry" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={packageForm.control} name="weightGrams" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (grams)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={packageForm.control} name="declaredValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Declared Value (₹)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField control={packageForm.control} name="lengthCm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (cm)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={packageForm.control} name="widthCm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (cm)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={packageForm.control} name="heightCm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl><Input {...field} type="number" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={packageForm.control} name="contentDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Description</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Describe the contents of your shipment" rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full bg-coke-red hover:bg-red-600 text-white gap-2">
                  Get Rates <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </motion.div>
        )}

        {/* Step 3: Courier Selection */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Account savings banner */}
            <div className="rounded-xl border border-candlestick-green/30 bg-candlestick-green/5 p-4">
              <p className="text-sm font-medium">
                💡 Account holders pay up to 52% less.{' '}
                <button onClick={() => router.push('/open-account')} className="text-coke-red hover:underline font-medium">
                  Open a free account →
                </button>
              </p>
            </div>

            <h2 className="font-semibold text-lg">Select Courier</h2>

            {courierOptions.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-6 text-center text-muted-foreground">
                No courier options available for this route. Try a different destination.
              </div>
            ) : (
              <div className="space-y-3">
                {courierOptions.map((option, idx) => {
                  const accountPrice = accountOptions[idx]?.price ?? option.price;
                  const savings = option.price - accountPrice;
                  return (
                    <div key={option.carrier} className="bg-card rounded-xl border border-border p-4 hover:border-coke-red/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{option.carrier}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{option.serviceName}</span>
                            {option.isRecommended && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-candlestick-green/10 text-candlestick-green font-medium">Recommended</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.transitDays.min}–{option.transitDays.max} days delivery
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {option.features.slice(0, 3).map(f => (
                              <span key={f} className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-xl font-bold">₹{option.price.toLocaleString('en-IN')}</p>
                          {savings > 0 && (
                            <p className="text-xs text-candlestick-green">
                              Account price: ₹{accountPrice.toLocaleString('en-IN')}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="mt-2 bg-coke-red hover:bg-red-600 text-white"
                            onClick={() => handleSelectCourier(idx)}
                            disabled={isLoading}
                          >
                            {isLoading ? <CircleNotch className="h-4 w-4 animate-spin" /> : 'Select'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
