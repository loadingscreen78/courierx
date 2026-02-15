"use client";

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Calculator,
  Package,
  MapPin,
  Scale,
  Clock,
  Truck,
  AlertCircle,
  Check,
  X,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Box,
  Plane,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CountrySelector } from '@/components/shipping/CountrySelector';
import { CountryRegulations } from '@/components/shipping/CountryRegulations';
import { ETADisplay } from '@/components/shipping/ETADisplay';
import { ProhibitedItemsAlert } from '@/components/shipping/ProhibitedItemsAlert';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { useCountries } from '@/hooks/useCountries';
import { useSeo } from '@/hooks/useSeo';
import { getCourierOptions, Carrier } from '@/lib/shipping/rateCalculator';
import { calculateETA } from '@/lib/shipping/etaCalculator';
import { getCarrierInfo } from '@/lib/shipping/courierSelection';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const carrierFeatures = [
  { id: 'tracking', label: 'Real-time tracking', icon: MapPin, dhl: true, fedex: true, aramex: true, shipglobal: false },
  { id: 'express', label: 'Express delivery', icon: Zap, dhl: true, fedex: true, aramex: false, shipglobal: false },
  { id: 'temperature', label: 'Temperature controlled', icon: Shield, dhl: true, fedex: false, aramex: false, shipglobal: false },
  { id: 'insurance', label: 'Insurance included', icon: Shield, dhl: true, fedex: true, aramex: true, shipglobal: true },
  { id: 'customs', label: 'Customs support', icon: Globe, dhl: true, fedex: true, aramex: true, shipglobal: false },
];

// Animated background component
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient orbs */}
    <motion.div
      className="absolute -top-40 -right-40 w-96 h-96 bg-coke-red/10 rounded-full blur-3xl"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    
    {/* Floating particles - deterministic positions */}
    {[
      { left: 10, top: 20, dur: 4 },
      { left: 18, top: 40, dur: 5 },
      { left: 26, top: 60, dur: 6 },
      { left: 34, top: 80, dur: 4 },
      { left: 42, top: 20, dur: 5 },
      { left: 50, top: 40, dur: 6 },
      { left: 58, top: 60, dur: 4 },
      { left: 66, top: 80, dur: 5 },
      { left: 74, top: 20, dur: 6 },
      { left: 82, top: 40, dur: 4 },
      { left: 90, top: 60, dur: 5 },
      { left: 98, top: 80, dur: 6 },
    ].map((p, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-coke-red/20"
        style={{
          left: `${p.left}%`,
          top: `${p.top}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: p.dur,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut",
        }}
      />
    ))}
    
    {/* Grid pattern */}
    <div 
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(227, 24, 55, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(227, 24, 55, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  </div>
);

// Animated carrier card component
const CarrierCard = ({
  option,
  isSelected,
  isRecommended,
  onSelect,
  index,
}: {
  option: ReturnType<typeof getCourierOptions>[0];
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  index: number;
}) => {
  const info = getCarrierInfo(option.carrier);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-3xl border-2 p-6 transition-all duration-300",
        isSelected
          ? "border-coke-red bg-coke-red/5 shadow-xl shadow-coke-red/10"
          : "border-border bg-card hover:border-coke-red/30 hover:shadow-lg"
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -right-3 z-10"
        >
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Best Value
          </Badge>
        </motion.div>
      )}
      
      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-4 left-4 w-6 h-6 rounded-full bg-coke-red flex items-center justify-center"
          >
            <Check className="h-4 w-4 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Carrier info */}
      <div className="text-center space-y-4">
        <motion.div
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
          className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center",
            isSelected ? "bg-coke-red text-white" : "bg-muted"
          )}
        >
          <Truck className="h-8 w-8" />
        </motion.div>
        
        <div>
          <h3 className="font-bold text-lg font-typewriter">{info.name}</h3>
          <p className="text-xs text-muted-foreground">{info.fullName}</p>
        </div>
        
        {/* Price */}
        <div className="py-4 border-y border-border/50">
          <motion.p
            key={option.price}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-coke-red"
          >
            ₹{option.price.toLocaleString()}
          </motion.p>
          <p className="text-xs text-muted-foreground mt-1">incl. all taxes</p>
        </div>
        
        {/* Transit time */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{option.transitDays.min}-{option.transitDays.max} business days</span>
        </div>
        
        {/* Features */}
        <div className="space-y-2 pt-2">
          {carrierFeatures.slice(0, 3).map((feature) => {
            const hasFeature = feature[option.carrier.toLowerCase() as keyof typeof feature] as boolean;
            return (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  hasFeature ? "text-foreground" : "text-muted-foreground/50"
                )}
              >
                {hasFeature ? (
                  <Check className="h-3 w-3 text-candlestick-green" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>{feature.label}</span>
              </div>
            );
          })}
        </div>
        
        {/* Select button */}
        <Button
          variant={isSelected ? "default" : "outline"}
          className={cn(
            "w-full mt-4 transition-all duration-300",
            isSelected && "bg-coke-red hover:bg-coke-red/90"
          )}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            <>
              Select Carrier
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// Weight selector component
const WeightSelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const presets = [
    { label: '500g', value: 500, icon: '📦' },
    { label: '1kg', value: 1000, icon: '📦' },
    { label: '2kg', value: 2000, icon: '📦' },
    { label: '5kg', value: 5000, icon: '📦' },
  ];

  return (
    <div className="space-y-4">
      {/* Slider visualization */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-coke-red to-coke-red/70 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((value / 10000) * 100, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-coke-red rounded-full shadow-lg"
          style={{ left: `calc(${Math.min((value / 10000) * 100, 100)}% - 10px)` }}
          whileHover={{ scale: 1.2 }}
        />
      </div>
      
      {/* Input and presets */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={100}
            max={30000}
            className="pr-12 text-lg font-semibold h-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            grams
          </span>
        </div>
      </div>
      
      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset, i) => (
          <motion.button
            key={preset.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(preset.value)}
            className={cn(
              "py-3 px-4 rounded-xl border-2 transition-all duration-200 text-center",
              value === preset.value
                ? "border-coke-red bg-coke-red/10 text-coke-red"
                : "border-border hover:border-coke-red/30"
            )}
          >
            <span className="text-lg">{preset.icon}</span>
            <p className="font-semibold text-sm mt-1">{preset.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Summary card component
const SummaryCard = ({
  selectedOption,
  eta,
  onBook,
}: {
  selectedOption: ReturnType<typeof getCourierOptions>[0] | undefined;
  eta: ReturnType<typeof calculateETA> | null;
  onBook: () => void;
}) => {
  if (!selectedOption) return null;
  
  const info = getCarrierInfo(selectedOption.carrier);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal to-charcoal/90 text-white p-8"
    >
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-coke-red rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary rounded-full blur-3xl" />
      </div>
      
      {/* Animated plane */}
      <motion.div
        className="absolute top-4 right-4 text-white/20"
        animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Plane className="h-16 w-16" />
      </motion.div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm">Your Selection</p>
            <h3 className="text-2xl font-bold font-typewriter mt-1">{info.fullName}</h3>
            {selectedOption.isRecommended && (
              <Badge className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Recommended
              </Badge>
            )}
          </div>
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"
          >
            <Truck className="h-7 w-7" />
          </motion.div>
        </div>
        
        {/* Price display */}
        <div className="py-6 border-y border-white/10">
          <p className="text-white/60 text-sm">Estimated Total</p>
          <motion.p
            key={selectedOption.price}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl font-bold mt-2"
          >
            ₹{selectedOption.price.toLocaleString()}
          </motion.p>
          <p className="text-white/40 text-xs mt-2">Including GST, fuel surcharge & all fees</p>
        </div>
        
        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4">
            <Clock className="h-5 w-5 text-coke-red mb-2" />
            <p className="text-white/60 text-xs">Transit Time</p>
            <p className="font-semibold">{selectedOption.transitDays.min}-{selectedOption.transitDays.max} days</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <Shield className="h-5 w-5 text-candlestick-green mb-2" />
            <p className="text-white/60 text-xs">Insurance</p>
            <p className="font-semibold">Included</p>
          </div>
        </div>
        
        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="lg"
            onClick={onBook}
            className="w-full h-14 text-lg bg-coke-red hover:bg-coke-red/90 shadow-lg shadow-coke-red/30"
          >
            <Package className="h-5 w-5 mr-2" />
            Book This Shipment
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>
        
        <p className="text-center text-white/40 text-xs">
          Sign up or log in to complete your booking
        </p>
      </div>
    </motion.div>
  );
};

// Main component
const PublicRateCalculator = () => {
  const router = useRouter();
  const { getCountry } = useCountries();
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });

  useSeo({
    title: 'Shipping Rate Calculator | CourierX - Compare International Shipping Rates',
    description: 'Calculate international shipping rates from India. Compare DHL, FedEx, Aramex, and ShipGlobal prices and delivery times for your package.',
    canonicalPath: '/public/rate-calculator',
  });

  const [destinationCountry, setDestinationCountry] = useState('');
  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  const selectedCountry = useMemo(() => {
    if (!destinationCountry) return null;
    return getCountry(destinationCountry);
  }, [destinationCountry, getCountry]);

  const isCountryServed = selectedCountry?.isServed ?? false;

  const courierOptions = useMemo(() => {
    if (!destinationCountry || !isCountryServed || weightGrams <= 0) return [];
    
    return getCourierOptions({
      destinationCountryCode: destinationCountry,
      shipmentType: 'gift',
      weightGrams,
      declaredValue: 10000,
    });
  }, [destinationCountry, isCountryServed, weightGrams]);

  const eta = useMemo(() => {
    if (!destinationCountry || !isCountryServed) return null;
    const carrier = selectedCarrier || 'DHL';
    return calculateETA(destinationCountry, carrier);
  }, [destinationCountry, selectedCarrier, isCountryServed]);

  const selectedOption = useMemo(() => {
    if (!selectedCarrier) return courierOptions.find(o => o.isRecommended) || courierOptions[0];
    return courierOptions.find(o => o.carrier === selectedCarrier) || courierOptions[0];
  }, [courierOptions, selectedCarrier]);

  const popularCountries = ['US', 'GB', 'AE', 'CA', 'AU', 'SG'];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      
      <main className="flex-1 relative">
        <AnimatedBackground />
        
        {/* Hero Section */}
        <section ref={heroRef} className="relative py-16 md:py-24">
          <div className="container max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={isHeroInView ? { scale: 1 } : {}}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coke-red/10 text-coke-red"
              >
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Instant Rate Calculator</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold font-typewriter"
              >
                Calculate Your{' '}
                <span className="text-coke-red">Shipping Cost</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Compare rates from top carriers and find the best deal for your international shipment
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="pb-24">
          <div className="container max-w-6xl relative z-10">
            {/* Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Destination */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <div className="w-8 h-8 rounded-lg bg-coke-red/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-coke-red" />
                        </div>
                        Where are you shipping to?
                      </Label>
                      
                      <CountrySelector
                        value={destinationCountry}
                        onValueChange={setDestinationCountry}
                        placeholder="Select destination country"
                      />
                      
                      {/* Popular destinations */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Popular destinations:</p>
                        <div className="flex flex-wrap gap-2">
                          {popularCountries.map((code, i) => {
                            const c = getCountry(code);
                            if (!c) return null;
                            return (
                              <motion.button
                                key={code}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDestinationCountry(code)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200",
                                  destinationCountry === code
                                    ? "border-coke-red bg-coke-red/10"
                                    : "border-border hover:border-coke-red/30"
                                )}
                              >
                                <span className="text-lg">{c.flag}</span>
                                <span className="text-sm font-medium">{c.name}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Scale className="h-4 w-4 text-primary" />
                        </div>
                        Package Weight
                      </Label>
                      
                      <WeightSelector value={weightGrams} onChange={setWeightGrams} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Country not served alert */}
            <AnimatePresence>
              {destinationCountry && !isCountryServed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6"
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Country not available</AlertTitle>
                    <AlertDescription>
                      {selectedCountry?.notServedReason || 'We do not currently ship to this destination.'}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Country regulations */}
            <AnimatePresence>
              {destinationCountry && isCountryServed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  <CountryRegulations countryCode={destinationCountry} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {destinationCountry && isCountryServed && courierOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-12 space-y-8"
                >
                  {/* Section header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <h2 className="text-2xl md:text-3xl font-bold font-typewriter">
                      Choose Your <span className="text-coke-red">Carrier</span>
                    </h2>
                    <p className="text-muted-foreground mt-2">
                      Compare rates and select the best option for your shipment
                    </p>
                  </motion.div>

                  {/* Carrier cards grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courierOptions.map((option, index) => (
                      <CarrierCard
                        key={option.carrier}
                        option={option}
                        isSelected={selectedCarrier === option.carrier || (!selectedCarrier && option.isRecommended)}
                        isRecommended={option.isRecommended}
                        onSelect={() => setSelectedCarrier(option.carrier)}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Summary and ETA */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <SummaryCard
                        selectedOption={selectedOption}
                        eta={eta}
                        onBook={() => router.push('/auth')}
                      />
                    </div>
                    <div>
                      {eta && <ETADisplay eta={eta} />}
                    </div>
                  </div>

                  {/* Prohibited items */}
                  <ProhibitedItemsAlert countryName={selectedCountry?.name} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            <AnimatePresence>
              {(!destinationCountry || courierOptions.length === 0) && isCountryServed !== false && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-12"
                >
                  <Card className="border-2 border-dashed">
                    <CardContent className="py-16 text-center space-y-6">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 mx-auto rounded-3xl bg-muted flex items-center justify-center"
                      >
                        <Box className="h-12 w-12 text-muted-foreground" />
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-xl font-typewriter">Ready to Calculate?</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                          Select a destination country and enter your package weight to see instant shipping rates from all carriers.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-8 pt-4">
                        {[
                          { icon: Globe, label: '150+ Countries' },
                          { icon: Truck, label: '4 Carriers' },
                          { icon: Zap, label: 'Instant Quotes' },
                        ].map((item, i) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <item.icon className="h-4 w-4 text-coke-red" />
                            <span>{item.label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default PublicRateCalculator;
