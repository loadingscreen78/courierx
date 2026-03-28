"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CircleNotch, UserPlus, Pill, FileText, Gift, Truck, Globe, User, Envelope, Phone, MapPin, Info, AirplaneTilt, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCourierOptions, calculateRate, type CourierOption } from '@/lib/shipping/rateCalculator';
import { getServedCountries } from '@/lib/shipping/countries';
import GuestSummaryStep from '@/components/guest-booking/GuestSummaryStep';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type FlowMode = 'international' | 'domestic';

interface PublicBookingFlowProps {
  mode: FlowMode;
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const internationalRateSchema = z.object({
  shipmentType: z.enum(['medicine', 'document', 'gift'], { required_error: 'Select shipment type' }),
  destinationCountry: z.string().min(2, 'Select destination country'),
  weightGrams: z.coerce.number().min(100, 'Min 100g').max(30000, 'Max 30kg'),
  lengthCm: z.coerce.number().min(1, 'Required').max(150),
  widthCm: z.coerce.number().min(1, 'Required').max(150),
  heightCm: z.coerce.number().min(1, 'Required').max(150),
  declaredValue: z.coerce.number().min(1, 'Required').max(50000, 'Max ₹50,000'),
}).superRefine((data, ctx) => {
  if (data.shipmentType === 'document') {
    if (data.weightGrams > 1000) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Documents max 1 kg', path: ['weightGrams'] });
    if (data.declaredValue > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Documents max ₹100 declared value', path: ['declaredValue'] });
  }
});

const domesticRateSchema = z.object({
  shipmentType: z.enum(['document', 'gift'], { required_error: 'Select shipment type' }),
  pickupPincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  deliveryPincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  weightKg: z.coerce.number().min(0.1, 'Min 0.1 kg').max(60, 'Max 60 kg'),
  lengthCm: z.coerce.number().min(1, 'Required').max(150),
  widthCm: z.coerce.number().min(1, 'Required').max(150),
  heightCm: z.coerce.number().min(1, 'Required').max(150),
  declaredValue: z.coerce.number().min(0).max(49000, 'Max ₹49,000'),
}).superRefine((data, ctx) => {
  if (data.shipmentType === 'document') {
    if (data.weightKg > 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Documents max 1 kg', path: ['weightKg'] });
    if (data.declaredValue > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Documents max ₹100 declared value', path: ['declaredValue'] });
  }
});

const senderReceiverSchema = z.object({
  senderName: z.string().min(2, 'Required'),
  senderPhone: z.string().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Valid Indian phone required'),
  senderEmail: z.string().email('Valid email required'),
  senderAddress: z.string().min(5, 'Required'),
  senderCity: z.string().min(2, 'Required'),
  senderPincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit pincode'),
  receiverName: z.string().min(2, 'Required'),
  receiverPhone: z.string().min(5, 'Required'),
  receiverEmail: z.string().email('Valid email required'),
  receiverAddress: z.string().min(5, 'Required'),
  receiverCity: z.string().min(2, 'Required'),
  receiverZipcode: z.string().min(3, 'Required'),
  contentDescription: z.string().min(3, 'Describe contents'),
});

type InternationalRateValues = z.infer<typeof internationalRateSchema>;
type DomesticRateValues = z.infer<typeof domesticRateSchema>;
type SenderReceiverValues = z.infer<typeof senderReceiverSchema>;

const shipmentTypeOptions = {
  international: [
    { value: 'medicine' as const, label: 'Medicine', icon: Pill, desc: 'Prescription medicines (CSB-IV)' },
    { value: 'document' as const, label: 'Document', icon: FileText, desc: 'Documents & certificates' },
    { value: 'gift' as const, label: 'Gift / Personal', icon: Gift, desc: 'Gifts, clothing, food' },
  ],
  domestic: [
    { value: 'document' as const, label: 'Document', icon: FileText, desc: 'Documents & paperwork' },
    { value: 'gift' as const, label: 'Gift / Parcel', icon: Gift, desc: 'Gifts, clothing, items' },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PublicBookingFlow({ mode }: PublicBookingFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isInternational = mode === 'international';
  const countries = getServedCountries();

  // Steps: 1=rate form, 2=rate results, 3=sender/receiver details
  const [step, setStep] = useState(1);
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);
  const [rateFormData, setRateFormData] = useState<InternationalRateValues | DomesticRateValues | null>(null);
  const [guestCouriers, setGuestCouriers] = useState<CourierOption[]>([]);
  const [accountCouriers, setAccountCouriers] = useState<CourierOption[]>([]);
  const [domesticCouriers, setDomesticCouriers] = useState<any[]>([]);
  const [isDomesticLoading, setIsDomesticLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [senderReceiverData, setSenderReceiverData] = useState<any>(null);
  const [addressSubStep, setAddressSubStep] = useState<'sender' | 'receiver' | 'content'>('sender');

  // ── International rate form ──
  const intlForm = useForm<InternationalRateValues>({
    resolver: zodResolver(internationalRateSchema),
    defaultValues: { shipmentType: undefined, destinationCountry: '', weightGrams: 500, lengthCm: 20, widthCm: 15, heightCm: 10, declaredValue: 1000 },
  });

  // ── Domestic rate form ──
  const domForm = useForm<DomesticRateValues>({
    resolver: zodResolver(domesticRateSchema),
    defaultValues: { shipmentType: undefined, pickupPincode: '', deliveryPincode: '', weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, declaredValue: 500 },
  });

  // ── Sender/Receiver form ──
  const detailsForm = useForm<SenderReceiverValues>({
    resolver: zodResolver(senderReceiverSchema),
    defaultValues: {
      senderName: '', senderPhone: '', senderEmail: '', senderAddress: '', senderCity: '', senderPincode: '',
      receiverName: '', receiverPhone: '', receiverEmail: '', receiverAddress: '', receiverCity: '', receiverZipcode: '',
      contentDescription: '',
    },
  });

  // Watch shipment type to conditionally render document-specific fields
  const watchedIntlType = intlForm.watch('shipmentType');
  const isDocumentIntl = watchedIntlType === 'document';

  // Watch domestic shipment type
  const watchedDomType = domForm.watch('shipmentType');
  const isDocumentDom = watchedDomType === 'document';

  // ── Handle international rate calculation ──
  const handleIntlRateSubmit = (values: InternationalRateValues) => {
    const guest = getCourierOptions({
      destinationCountryCode: values.destinationCountry,
      shipmentType: values.shipmentType,
      weightGrams: values.weightGrams,
      dimensions: { length: values.lengthCm, width: values.widthCm, height: values.heightCm },
      declaredValue: values.declaredValue,
    }, true);

    const account = getCourierOptions({
      destinationCountryCode: values.destinationCountry,
      shipmentType: values.shipmentType,
      weightGrams: values.weightGrams,
      dimensions: { length: values.lengthCm, width: values.widthCm, height: values.heightCm },
      declaredValue: values.declaredValue,
    }, false);

    setGuestCouriers(guest);
    setAccountCouriers(account);
    setRateFormData(values);
    setStep(2);
  };

  // ── Handle domestic rate calculation ──
  const handleDomRateSubmit = async (values: DomesticRateValues) => {
    setIsDomesticLoading(true);
    setRateFormData(values);
    try {
      const res = await fetch('/api/domestic/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode: values.pickupPincode,
          deliveryPincode: values.deliveryPincode,
          weightKg: values.weightKg,
          lengthCm: values.lengthCm,
          widthCm: values.widthCm,
          heightCm: values.heightCm,
          declaredValue: values.declaredValue,
          shipmentType: values.shipmentType,
          isGuest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDomesticCouriers(data.couriers || []);
        setStep(2);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to fetch rates', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setIsDomesticLoading(false);
    }
  };

  // ── Select a courier and go to details ──
  const handleSelectCourier = (courier: any) => {
    setSelectedCourier(courier);
    setStep(3);
  };

  // ── Submit sender/receiver and go to summary ──
  const handleFinalSubmit = (values: SenderReceiverValues) => {
    setSenderReceiverData(values);
    setStep(4);
  };

  // ── Validate sender fields before sliding to receiver ──
  const handleSenderNext = async () => {
    const senderFields = ['senderName', 'senderPhone', 'senderEmail', 'senderAddress', 'senderCity', 'senderPincode'] as const;
    const result = await detailsForm.trigger(senderFields);
    if (result) setAddressSubStep('receiver');
  };

  // ── Validate receiver fields before sliding to content ──
  const handleReceiverNext = async () => {
    const receiverFields = ['receiverName', 'receiverPhone', 'receiverEmail', 'receiverAddress', 'receiverCity', 'receiverZipcode'] as const;
    const result = await detailsForm.trigger(receiverFields);
    if (result) setAddressSubStep('content');
  };

  const handleBack = () => {
    if (step === 1) router.push('/public/book');
    else setStep(step - 1);
  };

  const stepLabels = ['Shipment Details', 'Select Rate', 'Sender & Receiver', 'Summary & Pay'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img alt="CourierX" src="/lovable-uploads/19a008e8-fa55-402b-94a0-f1a05b4d70b4.png" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/auth')} className="rounded-xl text-sm">Sign In</Button>
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
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {isInternational ? <Globe className="h-6 w-6 text-blue-600" weight="duotone" /> : <Truck className="h-6 w-6 text-green-600" weight="duotone" />}
              {isInternational ? 'International Shipping' : 'Domestic Shipping'}
            </h1>
            <p className="text-muted-foreground text-sm">Guest booking — standard rates apply</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors mb-1 ${i + 1 <= step ? 'bg-coke-red' : 'bg-muted'}`} />
              <p className={`text-xs ${i + 1 <= step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* ═══════════════ STEP 1: Rate Calculator Form ═══════════════ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h2 className="font-semibold text-lg">Enter shipment details to get rates</h2>

              {isInternational ? (
                <Form {...intlForm}>
                  <form onSubmit={intlForm.handleSubmit(handleIntlRateSubmit)} className="space-y-4">
                    {/* Shipment Type */}
                    <FormField control={intlForm.control} name="shipmentType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are you shipping?</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {shipmentTypeOptions.international.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                field.value === opt.value
                                  ? 'border-coke-red bg-coke-red/5 ring-1 ring-coke-red/20'
                                  : 'border-border hover:border-muted-foreground/30'
                              }`}
                            >
                              <opt.icon className={`h-5 w-5 mb-1 ${field.value === opt.value ? 'text-coke-red' : 'text-muted-foreground'}`} weight="duotone" />
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Destination */}
                    <FormField control={intlForm.control} name="destinationCountry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Weight + Value — document-specific */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={intlForm.control} name="weightGrams" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          {isDocumentIntl ? (
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select weight" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="500">Up to 500g</SelectItem>
                                <SelectItem value="1000">Up to 1 kg</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl><Input {...field} type="number" placeholder="Weight in grams" /></FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={intlForm.control} name="declaredValue" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declared Value (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder={isDocumentIntl ? 'Max ₹100' : '1000'} max={isDocumentIntl ? 100 : 50000} />
                          </FormControl>
                          {isDocumentIntl && <p className="text-xs text-muted-foreground">Documents cannot exceed ₹100 declared value</p>}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Dimensions */}
                    <div>
                      <p className="text-sm font-medium mb-2">Package Dimensions (cm)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField control={intlForm.control} name="lengthCm" render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} type="number" placeholder="Length" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={intlForm.control} name="widthCm" render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} type="number" placeholder="Width" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={intlForm.control} name="heightCm" render={({ field }) => (
                          <FormItem>
                            <FormControl><Input {...field} type="number" placeholder="Height" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-coke-red hover:bg-red-600 text-white gap-2 py-5">
                      Calculate Rates <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              ) : (
                /* ── Domestic form ── */
                <Form {...domForm}>
                  <form onSubmit={domForm.handleSubmit(handleDomRateSubmit)} className="space-y-4">
                    {/* Shipment Type */}
                    <FormField control={domForm.control} name="shipmentType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What are you shipping?</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {shipmentTypeOptions.domestic.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                field.value === opt.value
                                  ? 'border-coke-red bg-coke-red/5 ring-1 ring-coke-red/20'
                                  : 'border-border hover:border-muted-foreground/30'
                              }`}
                            >
                              <opt.icon className={`h-5 w-5 mb-1 ${field.value === opt.value ? 'text-coke-red' : 'text-muted-foreground'}`} weight="duotone" />
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Pincodes */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={domForm.control} name="pickupPincode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Pincode</FormLabel>
                          <FormControl><Input {...field} placeholder="110001" maxLength={6} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={domForm.control} name="deliveryPincode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Pincode</FormLabel>
                          <FormControl><Input {...field} placeholder="400001" maxLength={6} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Weight + Value — document-specific */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={domForm.control} name="weightKg" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          {isDocumentDom ? (
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select weight" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0.5">Up to 500g</SelectItem>
                                <SelectItem value="1">Up to 1 kg</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl><Input {...field} type="number" step="0.1" placeholder="Weight in kg" /></FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={domForm.control} name="declaredValue" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declared Value (₹)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder={isDocumentDom ? 'Max ₹100' : '500'} max={isDocumentDom ? 100 : 49000} />
                          </FormControl>
                          {isDocumentDom && <p className="text-xs text-muted-foreground">Documents cannot exceed ₹100 declared value</p>}
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Dimensions */}
                    <div>
                      <p className="text-sm font-medium mb-2">Package Dimensions (cm)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <FormField control={domForm.control} name="lengthCm" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} type="number" placeholder="Length" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={domForm.control} name="widthCm" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} type="number" placeholder="Width" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={domForm.control} name="heightCm" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} type="number" placeholder="Height" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-coke-red hover:bg-red-600 text-white gap-2 py-5" disabled={isDomesticLoading}>
                      {isDomesticLoading ? <><CircleNotch className="h-4 w-4 animate-spin" /> Fetching Rates...</> : <>Calculate Rates <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════ STEP 2: Rate Results ═══════════════ */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Account savings banner */}
            <div className="rounded-xl border border-candlestick-green/30 bg-candlestick-green/5 p-4">
              <p className="text-sm">
                💡 <span className="font-medium">Account holders pay up to 52% less</span> on these same routes.{' '}
                <button onClick={() => router.push('/open-account')} className="text-coke-red hover:underline font-semibold">Open a free account →</button>
              </p>
            </div>

            <h2 className="font-semibold text-lg">Available Rates</h2>
            <p className="text-sm text-muted-foreground">Select a courier to proceed with booking. Prices include GST.</p>

            {isInternational ? (
              guestCouriers.length === 0 ? (
                /* ── Animated no-service for international ── */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="bg-card rounded-2xl border border-border p-8 text-center space-y-4"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto"
                  >
                    <AirplaneTilt className="h-8 w-8 text-amber-500" weight="duotone" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 className="font-semibold text-lg">No Service Available</h3>
                    <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                      No courier options available for this route. Try a different destination or weight.
                    </p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Try Different Route
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/contact')}>
                      Contact Support
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {guestCouriers.map((option, idx) => {
                    const accountPrice = accountCouriers[idx]?.price ?? option.price;
                    const savings = option.price - accountPrice;
                    const rateBreakdown = rateFormData ? calculateRate({
                      destinationCountryCode: (rateFormData as InternationalRateValues).destinationCountry,
                      shipmentType: (rateFormData as InternationalRateValues).shipmentType,
                      weightGrams: (rateFormData as InternationalRateValues).weightGrams,
                      dimensions: { length: (rateFormData as InternationalRateValues).lengthCm, width: (rateFormData as InternationalRateValues).widthCm, height: (rateFormData as InternationalRateValues).heightCm },
                      declaredValue: (rateFormData as InternationalRateValues).declaredValue,
                    }, true) : null;

                    return (
                      <div key={option.carrier} className="bg-card rounded-xl border border-border overflow-hidden hover:border-coke-red/30 transition-colors">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">{option.carrier}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{option.serviceName}</span>
                                {option.isRecommended && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-candlestick-green/10 text-candlestick-green font-medium">Best Value</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{option.transitDays.min}–{option.transitDays.max} days delivery</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {option.features.slice(0, 3).map(f => (
                                  <span key={f} className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">{f}</span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-2xl font-bold">₹{option.price.toLocaleString('en-IN')}</p>
                              {savings > 0 && (
                                <p className="text-xs text-candlestick-green mt-0.5">
                                  With account: <span className="font-semibold">₹{accountPrice.toLocaleString('en-IN')}</span>
                                </p>
                              )}
                              <Button size="sm" className="mt-2 bg-coke-red hover:bg-red-600 text-white" onClick={() => handleSelectCourier(option)}>
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                        {/* Rate breakdown (show for first/recommended) */}
                        {rateBreakdown && idx === 0 && (
                          <div className="border-t border-border bg-muted/30 px-4 py-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Rate Breakdown</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                              {rateBreakdown.breakdown.map(item => (
                                <div key={item.label} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{item.label}</span>
                                  <span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-border">
                              <span>Total</span>
                              <span>₹{rateBreakdown.total.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ── Domestic rate results ── */
              (() => {
                // For documents: show only air services, fallback to Delhivery Surface
                const isDocType = rateFormData && 'shipmentType' in rateFormData && rateFormData.shipmentType === 'document';
                let filteredDomestic = domesticCouriers;
                if (isDocType) {
                  const airOnly = domesticCouriers.filter((c: any) => c.mode === 'air');
                  if (airOnly.length > 0) {
                    filteredDomestic = airOnly;
                  } else {
                    // Fallback: Delhivery Surface
                    const delhiverySurface = domesticCouriers.filter((c: any) =>
                      c.courier_name?.toLowerCase().includes('delhivery') && c.mode === 'surface'
                    );
                    filteredDomestic = delhiverySurface;
                  }
                }

                return filteredDomestic.length === 0 ? (
                  /* ── Animated no-service component ── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="bg-card rounded-2xl border border-border p-8 text-center space-y-4"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto"
                    >
                      <AirplaneTilt className="h-8 w-8 text-amber-500" weight="duotone" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="font-semibold text-lg">No Service Available</h3>
                      <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                        {isDocType
                          ? 'No air courier services are available for document shipments on this route right now.'
                          : 'No couriers available for this route.'}
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row gap-2 justify-center pt-2"
                    >
                      <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Try Different Route
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push('/contact')}>
                        Contact Support
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {isDocType && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2">
                        <AirplaneTilt className="h-4 w-4 shrink-0" weight="fill" />
                        <span>Showing air service rates for document shipments</span>
                      </div>
                    )}
                    {filteredDomestic.map((c: any) => (
                    <div key={c.courier_company_id} className="bg-card rounded-xl border border-border p-4 hover:border-coke-red/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{c.courier_name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{c.mode}</span>
                            {c.is_recommended && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-candlestick-green/10 text-candlestick-green font-medium">Cheapest</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{c.estimated_delivery_days} days delivery</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-2xl font-bold">₹{c.customer_price?.toLocaleString('en-IN')}</p>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Base: ₹{c.shipping_charge?.toLocaleString('en-IN')} + GST: ₹{c.gst_amount?.toLocaleString('en-IN')}
                          </div>
                          <Button size="sm" className="mt-2 bg-coke-red hover:bg-red-600 text-white" onClick={() => handleSelectCourier(c)}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()
            )}
          </motion.div>
        )}

        {/* ═══════════════ STEP 3: Sender & Receiver Details (Slider) ═══════════════ */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            {/* Selected courier summary */}
            {selectedCourier && (
              <div className="bg-muted/50 rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Courier</p>
                  <p className="font-semibold">{(selectedCourier as any).carrier || (selectedCourier as any).courier_name}</p>
                </div>
                <p className="text-xl font-bold">₹{((selectedCourier as any).price || (selectedCourier as any).customer_price)?.toLocaleString('en-IN')}</p>
              </div>
            )}

            {/* Sub-step indicator */}
            <div className="flex items-center gap-2">
              {(['sender', 'receiver', 'content'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s === addressSubStep ? 'bg-coke-red text-white' :
                    (['sender', 'receiver', 'content'].indexOf(addressSubStep) > i) ? 'bg-candlestick-green text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {(['sender', 'receiver', 'content'].indexOf(addressSubStep) > i) ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline ${s === addressSubStep ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {s === 'sender' ? 'Sender' : s === 'receiver' ? 'Receiver' : 'Contents'}
                  </span>
                  {i < 2 && <div className="flex-1 h-px bg-border" />}
                </div>
              ))}
            </div>

            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleFinalSubmit)}>
                {/* Slider container */}
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    {/* ── Sender Slide ── */}
                    {addressSubStep === 'sender' && (
                      <motion.div
                        key="sender"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-card rounded-xl border border-border p-6 space-y-4"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-full bg-coke-red/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-coke-red" weight="duotone" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">Sender Details</h3>
                            <p className="text-xs text-muted-foreground">Pickup address in India</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={detailsForm.control} name="senderName" render={({ field }) => (
                              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="Sender name" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={detailsForm.control} name="senderPhone" render={({ field }) => (
                              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="+91 98765 43210" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={detailsForm.control} name="senderEmail" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="sender@email.com" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={detailsForm.control} name="senderAddress" render={({ field }) => (
                            <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="Full address" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={detailsForm.control} name="senderCity" render={({ field }) => (
                              <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="City" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={detailsForm.control} name="senderPincode" render={({ field }) => (
                              <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} placeholder="110001" maxLength={6} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                        <Button type="button" onClick={handleSenderNext} className="w-full bg-coke-red hover:bg-red-600 text-white gap-2 py-5">
                          Next: Receiver Details <ArrowRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}

                    {/* ── Receiver Slide ── */}
                    {addressSubStep === 'receiver' && (
                      <motion.div
                        key="receiver"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-card rounded-xl border border-border p-6 space-y-4"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-blue-600" weight="duotone" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">Receiver Details</h3>
                            <p className="text-xs text-muted-foreground">{isInternational ? 'Delivery address abroad' : 'Delivery address in India'}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={detailsForm.control} name="receiverName" render={({ field }) => (
                              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="Receiver name" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={detailsForm.control} name="receiverPhone" render={({ field }) => (
                              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="Phone number" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                          <FormField control={detailsForm.control} name="receiverEmail" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="receiver@email.com" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={detailsForm.control} name="receiverAddress" render={({ field }) => (
                            <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="Full address" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={detailsForm.control} name="receiverCity" render={({ field }) => (
                              <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="City" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={detailsForm.control} name="receiverZipcode" render={({ field }) => (
                              <FormItem><FormLabel>{isInternational ? 'Zip / Postal Code' : 'Pincode'}</FormLabel><FormControl><Input {...field} placeholder={isInternational ? 'Zipcode' : '400001'} maxLength={isInternational ? 10 : 6} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setAddressSubStep('sender')} className="flex-1 gap-1.5">
                            <ArrowLeft className="h-4 w-4" /> Sender
                          </Button>
                          <Button type="button" onClick={handleReceiverNext} className="flex-1 bg-coke-red hover:bg-red-600 text-white gap-2">
                            Next: Contents <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Content Description Slide ── */}
                    {addressSubStep === 'content' && (
                      <motion.div
                        key="content"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-card rounded-xl border border-border p-6 space-y-4"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" weight="duotone" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">Shipment Contents</h3>
                            <p className="text-xs text-muted-foreground">{isInternational ? 'Required for customs declaration' : 'Describe what you are shipping'}</p>
                          </div>
                        </div>
                        <FormField control={detailsForm.control} name="contentDescription" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Description</FormLabel>
                            <FormControl><Textarea {...field} placeholder={isInternational ? 'Describe contents for customs declaration' : 'Describe the contents of your shipment'} rows={3} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex gap-3">
                          <Button type="button" variant="outline" onClick={() => setAddressSubStep('receiver')} className="flex-1 gap-1.5">
                            <ArrowLeft className="h-4 w-4" /> Receiver
                          </Button>
                          <Button type="submit" className="flex-1 bg-coke-red hover:bg-red-600 text-white gap-2">
                            Continue to Summary <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </Form>
          </motion.div>
        )}

        {/* ═══════════════ STEP 4: Summary & Pay ═══════════════ */}
        {step === 4 && senderReceiverData && (
          <GuestSummaryStep
            mode={mode}
            rateFormData={rateFormData}
            selectedCourier={selectedCourier}
            senderReceiver={senderReceiverData}
            onBack={() => setStep(3)}
          />
        )}
      </main>
    </div>
  );
}
