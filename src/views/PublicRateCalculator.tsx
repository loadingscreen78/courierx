"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Package, MapPin, Scales, Clock, Truck, Warning, Check, X, Star,
  ArrowRight, Sparkle, Lightning, Shield, Globe, CaretRight, Cube, Airplane,
  House, Lock,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import type { CourierOption } from '@/lib/domestic/types';

type ShippingMode = 'international' | 'domestic';
type DomesticFilterTab = 'all' | 'air' | 'surface';
const COMING_SOON_CARRIERS = ['DHL', 'ShipGlobal'];

const carrierFeatures = [
  { id: 'tracking', label: 'Real-time tracking', dhl: true, fedex: true, aramex: true, shipglobal: false },
  { id: 'express', label: 'Express delivery', dhl: true, fedex: true, aramex: false, shipglobal: false },
  { id: 'temperature', label: 'Temperature controlled', dhl: true, fedex: false, aramex: false, shipglobal: false },
];

const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div className="absolute -top-40 -right-40 w-96 h-96 bg-coke-red/10 rounded-full blur-3xl"
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
  </div>
);

// ─── Mode Selection Modal ─────────────────────────────────────────────
const ModeSelectionModal = ({ open, onSelect }: {
  open: boolean;
  onSelect: (m: ShippingMode) => void;
}) => {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-background rounded-3xl shadow-2xl border-2 max-w-lg w-full">
        <div className="text-center p-8 pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-coke-red/10 flex items-center justify-center mb-4">
            <Package size={32} weight="bold" className="text-coke-red" />
          </div>
          <h2 className="text-2xl font-bold font-typewriter">
            Where are you <span className="text-coke-red">shipping?</span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">Choose your shipping type to get started</p>
        </div>
        <div className="px-8 pb-8 grid grid-cols-2 gap-4">
          <motion.button whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect('domestic')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-coke-red/50 hover:bg-coke-red/5 transition-all group">
            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-coke-red/15">
              <House size={28} weight="bold" className="text-orange-500 group-hover:text-coke-red" />
            </div>
            <p className="font-bold text-lg font-typewriter">Domestic</p>
            <p className="text-xs text-muted-foreground">Within India</p>
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect('international')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-coke-red/50 hover:bg-coke-red/5 transition-all group">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-coke-red/15">
              <Globe size={28} weight="bold" className="text-blue-500 group-hover:text-coke-red" />
            </div>
            <p className="font-bold text-lg font-typewriter">International</p>
            <p className="text-xs text-muted-foreground">150+ Countries</p>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Shipping Mode Toggle ─────────────────────────────────────────────
const ShippingModeToggle = ({ mode, onChange }: {
  mode: ShippingMode;
  onChange: (m: ShippingMode) => void;
}) => (
  <div className="flex items-center justify-center">
    <div className="relative inline-flex items-center bg-muted/60 rounded-full p-1.5 border shadow-inner">
      <motion.div className="absolute top-1.5 bottom-1.5 rounded-full bg-coke-red shadow-lg"
        initial={false}
        animate={{
          left: mode === 'domestic' ? '6px' : '50%',
          right: mode === 'international' ? '6px' : '50%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }} />
      <button onClick={() => onChange('domestic')}
        className={cn("relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors",
          mode === 'domestic' ? "text-white" : "text-muted-foreground hover:text-foreground")}>
        <House size={18} weight="bold" />
        <span className="hidden sm:inline">Domestic</span>
        <span className="sm:hidden">🇮🇳</span>
      </button>
      <button onClick={() => onChange('international')}
        className={cn("relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors",
          mode === 'international' ? "text-white" : "text-muted-foreground hover:text-foreground")}>
        <Globe size={18} weight="bold" />
        <span className="hidden sm:inline">International</span>
        <span className="sm:hidden">🌍</span>
      </button>
    </div>
  </div>
);

// ─── Weight Selector (International) ──────────────────────────────────
const WeightSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const presets = [
    { label: '500g', value: 500 }, { label: '1kg', value: 1000 },
    { label: '2kg', value: 2000 }, { label: '5kg', value: 5000 },
  ];
  return (
    <div className="space-y-4">
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-coke-red to-coke-red/70 rounded-full"
          animate={{ width: `${Math.min((value / 10000) * 100, 100)}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="relative flex-1">
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          min={100} max={30000} className="pr-16 text-lg font-semibold h-12" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">grams</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((p) => (
          <motion.button key={p.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onChange(p.value)}
            className={cn("py-3 px-4 rounded-xl border-2 text-center transition-all",
              value === p.value ? "border-coke-red bg-coke-red/10 text-coke-red" : "border-border hover:border-coke-red/30")}>
            <span className="text-lg">📦</span>
            <p className="font-semibold text-sm mt-1">{p.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ─── International Carrier Card ───────────────────────────────────────
const CarrierCard = ({ option, isSelected, onSelect, index }: {
  option: ReturnType<typeof getCourierOptions>[0];
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) => {
  const info = getCarrierInfo(option.carrier);
  const isComingSoon = COMING_SOON_CARRIERS.includes(option.carrier);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={isComingSoon ? {} : { y: -8, scale: 1.02 }}
      onClick={isComingSoon ? undefined : onSelect}
      className={cn("relative rounded-3xl border-2 p-6 transition-all duration-300",
        isComingSoon ? "border-border bg-muted/40 opacity-70 cursor-not-allowed"
          : isSelected ? "border-coke-red bg-coke-red/5 shadow-xl shadow-coke-red/10 cursor-pointer"
          : "border-border bg-card hover:border-coke-red/30 hover:shadow-lg cursor-pointer")}>
      {isComingSoon && (
        <div className="absolute inset-0 z-20 rounded-3xl flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <Badge className="bg-charcoal text-white border-0 shadow-lg px-4 py-2 text-sm gap-2">
            <Lock size={14} weight="bold" /> COMING SOON
          </Badge>
        </div>
      )}
      {option.isRecommended && !isComingSoon && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-3 z-10">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1">
            <Star size={12} weight="fill" className="mr-1" /> Best Value
          </Badge>
        </motion.div>
      )}
      <AnimatePresence>
        {isSelected && !isComingSoon && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute top-4 left-4 w-6 h-6 rounded-full bg-coke-red flex items-center justify-center">
            <Check size={16} weight="bold" className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-center space-y-4">
        <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center",
          isComingSoon ? "bg-muted" : isSelected ? "bg-coke-red text-white" : "bg-muted")}>
          <Truck size={32} weight="bold" />
        </div>
        <div>
          <h3 className="font-bold text-lg font-typewriter">{info.name}</h3>
          <p className="text-xs text-muted-foreground">{info.fullName}</p>
        </div>
        <div className="py-4 border-y border-border/50">
          <p className={cn("text-3xl font-bold", isComingSoon ? "text-muted-foreground" : "text-coke-red")}>
            ₹{option.price.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">incl. all taxes</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          <Clock size={16} weight="bold" className="text-muted-foreground" />
          <span>{option.transitDays.min}-{option.transitDays.max} business days</span>
        </div>
        <div className="space-y-2 pt-2">
          {carrierFeatures.map((f) => {
            const has = f[option.carrier.toLowerCase() as keyof typeof f] as boolean;
            return (
              <div key={f.id} className={cn("flex items-center gap-2 text-xs", has ? "text-foreground" : "text-muted-foreground/50")}>
                {has ? <Check size={12} weight="bold" className="text-candlestick-green" /> : <X size={12} weight="bold" />}
                <span>{f.label}</span>
              </div>
            );
          })}
        </div>
        {isComingSoon ? (
          <Button variant="outline" className="w-full mt-4 opacity-50" disabled>
            <Lock size={16} weight="bold" className="mr-2" /> Coming Soon
          </Button>
        ) : (
          <Button variant={isSelected ? "default" : "outline"}
            className={cn("w-full mt-4 transition-all", isSelected && "bg-coke-red hover:bg-coke-red/90")}>
            {isSelected ? <><Check size={16} weight="bold" className="mr-2" /> Selected</> : <>Select Carrier <CaretRight size={16} weight="bold" className="ml-2" /></>}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Domestic Courier Card ────────────────────────────────────────────
const DomesticCourierCard = ({ courier, isSelected, onSelect, index }: {
  courier: CourierOption; isSelected: boolean; onSelect: () => void; index: number;
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const isAir = courier.mode === 'air';
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, scale: 1.01 }} onClick={onSelect}
      className={cn("relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300",
        isSelected ? "border-coke-red bg-coke-red/5 shadow-xl shadow-coke-red/10"
          : "border-border bg-card hover:border-coke-red/30 hover:shadow-lg")}>
      {courier.is_recommended && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-3 -right-3 z-10">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1">
            <Star size={12} weight="fill" className="mr-1" /> Best Value
          </Badge>
        </motion.div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isSelected ? "bg-coke-red/15" : "bg-muted")}>
            {isSelected ? <Check size={24} weight="bold" className="text-coke-red" />
              : <Truck size={24} weight="bold" className="text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn("font-semibold truncate", isSelected ? "text-coke-red" : "text-foreground")}>
                {courier.courier_name}
              </p>
              <Badge variant="outline" className={cn("text-[10px] shrink-0",
                isAir ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
                {isAir ? '✈ Air' : '🚛 Surface'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={14} weight="bold" /> {courier.estimated_delivery_days} day{courier.estimated_delivery_days !== 1 ? 's' : ''}
              </span>
              {courier.rating > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star size={14} weight="fill" className="text-amber-400" /> {courier.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className={cn("text-2xl font-bold font-typewriter", isSelected ? "text-coke-red" : "text-foreground")}>
            ₹{courier.customer_price.toLocaleString('en-IN')}
          </p>
          <button onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            {showBreakdown ? 'hide' : 'view'} breakdown
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showBreakdown && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shipping Charges</span>
                <span className="font-medium">₹{courier.shipping_charge.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium">₹{courier.gst_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-1 border-t border-dashed border-border/50">
                <span>Total</span>
                <span className="text-coke-red">₹{courier.customer_price.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Summary Card (shared) ────────────────────────────────────────────
const SummaryCard = ({ title, price, transitLabel, onBook }: {
  title: string; price: number; transitLabel: string; onBook: () => void;
}) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal to-charcoal/90 text-white p-8">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-coke-red rounded-full blur-3xl" />
    </div>
    <motion.div className="absolute top-4 right-4 text-white/20"
      animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <Airplane size={64} weight="bold" />
    </motion.div>
    <div className="relative z-10 space-y-6">
      <div>
        <p className="text-white/60 text-sm">Your Selection</p>
        <h3 className="text-2xl font-bold font-typewriter mt-1">{title}</h3>
      </div>
      <div className="py-6 border-y border-white/10">
        <p className="text-white/60 text-sm">Estimated Total</p>
        <p className="text-5xl font-bold mt-2">₹{price.toLocaleString('en-IN')}</p>
        <p className="text-white/40 text-xs mt-2">Including GST & all fees</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-4">
          <Clock size={20} weight="bold" className="text-coke-red mb-2" />
          <p className="text-white/60 text-xs">Transit Time</p>
          <p className="font-semibold">{transitLabel}</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4">
          <Shield size={20} weight="bold" className="text-candlestick-green mb-2" />
          <p className="text-white/60 text-xs">Insurance</p>
          <p className="font-semibold">Included</p>
        </div>
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button size="lg" onClick={onBook}
          className="w-full h-14 text-lg bg-coke-red hover:bg-coke-red/90 shadow-lg shadow-coke-red/30">
          <Package size={20} weight="bold" className="mr-2" />
          Book This Shipment
          <ArrowRight size={20} weight="bold" className="ml-2" />
        </Button>
      </motion.div>
      <p className="text-center text-white/40 text-xs">Sign up or log in to complete your booking</p>
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────
const PublicRateCalculator = () => {
  const router = useRouter();
  const { getCountry } = useCountries();
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });

  useSeo({
    title: 'Shipping Rate Calculator | CourierX - Compare Shipping Rates',
    description: 'Calculate domestic and international shipping rates from India. Compare carriers, prices and delivery times.',
    canonicalPath: '/public/rate-calculator',
  });

  // ── Shared state ──
  const [showModal, setShowModal] = useState(true);
  const [shippingMode, setShippingMode] = useState<ShippingMode>('international');

  // ── International state ──
  const [destinationCountry, setDestinationCountry] = useState('');
  const [weightGrams, setWeightGrams] = useState(500);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);

  // ── Domestic state ──
  const [pickupPincode, setPickupPincode] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [domesticWeightKg, setDomesticWeightKg] = useState(1);
  const [domesticLength, setDomesticLength] = useState(10);
  const [domesticWidth, setDomesticWidth] = useState(10);
  const [domesticHeight, setDomesticHeight] = useState(10);
  const [domesticCouriers, setDomesticCouriers] = useState<CourierOption[]>([]);
  const [domesticLoading, setDomesticLoading] = useState(false);
  const [domesticError, setDomesticError] = useState<string | null>(null);
  const [selectedDomesticCourier, setSelectedDomesticCourier] = useState<CourierOption | null>(null);
  const [domesticFilterTab, setDomesticFilterTab] = useState<DomesticFilterTab>('all');

  const handleModeSelect = (mode: ShippingMode) => {
    setShippingMode(mode);
    setShowModal(false);
  };

  // ── International computed ──
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
    return calculateETA(destinationCountry, selectedCarrier || 'DHL');
  }, [destinationCountry, selectedCarrier, isCountryServed]);

  const selectedOption = useMemo(() => {
    if (!selectedCarrier) return courierOptions.find(o => o.isRecommended && !COMING_SOON_CARRIERS.includes(o.carrier)) || courierOptions.find(o => !COMING_SOON_CARRIERS.includes(o.carrier));
    return courierOptions.find(o => o.carrier === selectedCarrier) || courierOptions[0];
  }, [courierOptions, selectedCarrier]);

  const popularCountries = ['US', 'GB', 'AE', 'CA', 'AU', 'SG'];

  // ── Domestic fetch ──
  const fetchDomesticRates = async () => {
    if (!/^\d{6}$/.test(pickupPincode) || !/^\d{6}$/.test(deliveryPincode)) return;
    setDomesticLoading(true);
    setDomesticError(null);
    setSelectedDomesticCourier(null);
    try {
      const res = await fetch('/api/public/domestic-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPincode, deliveryPincode,
          weightKg: domesticWeightKg,
          lengthCm: domesticLength, widthCm: domesticWidth, heightCm: domesticHeight,
          declaredValue: 5000, shipmentType: 'gift',
        }),
      });
      const result = await res.json();
      if (!result.success) { setDomesticError(result.error || 'Failed to fetch rates'); return; }
      setDomesticCouriers(result.couriers || []);
    } catch { setDomesticError('Network error. Please try again.'); }
    finally { setDomesticLoading(false); }
  };

  // Domestic filtered couriers
  const filteredDomesticCouriers = useMemo(() => {
    if (domesticFilterTab === 'all') return domesticCouriers;
    return domesticCouriers.filter(c => c.mode === domesticFilterTab);
  }, [domesticCouriers, domesticFilterTab]);

  const airCount = useMemo(() => domesticCouriers.filter(c => c.mode === 'air').length, [domesticCouriers]);
  const surfaceCount = useMemo(() => domesticCouriers.filter(c => c.mode === 'surface').length, [domesticCouriers]);

  // ── JSX ──
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <ModeSelectionModal open={showModal} onSelect={handleModeSelect} />

      <main className="flex-1 relative">
        <AnimatedBackground />

        {/* Hero */}
        <section ref={heroRef} className="relative py-16 md:py-24">
          <div className="container max-w-6xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }} className="text-center space-y-6">
              <motion.div initial={{ scale: 0 }}
                animate={isHeroInView ? { scale: 1 } : {}}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coke-red/10 text-coke-red">
                <Sparkle className="h-5 w-5" />
                <span className="font-semibold">Instant Rate Calculator</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-typewriter">
                Calculate Your{' '}<span className="text-coke-red">Shipping Cost</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Compare rates from top carriers and find the best deal for your{' '}
                {shippingMode === 'domestic' ? 'domestic' : 'international'} shipment
              </p>
              {/* Toggle */}
              <ShippingModeToggle mode={shippingMode} onChange={setShippingMode} />
            </motion.div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="pb-24">
          <div className="container max-w-6xl relative z-10">

            {/* ═══════ INTERNATIONAL MODE ═══════ */}
            {shippingMode === 'international' && (
              <motion.div key="intl" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                {/* Input Card */}
                <Card className="border-2 shadow-xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Destination */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-coke-red/10 flex items-center justify-center">
                            <MapPin size={16} weight="bold" className="text-coke-red" />
                          </div>
                          Where are you shipping to?
                        </Label>
                        <CountrySelector value={destinationCountry} onValueChange={setDestinationCountry}
                          placeholder="Select destination country" />
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Popular destinations:</p>
                          <div className="flex flex-wrap gap-2">
                            {popularCountries.map((code) => {
                              const c = getCountry(code);
                              if (!c) return null;
                              return (
                                <motion.button key={code} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => setDestinationCountry(code)}
                                  className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                                    destinationCountry === code ? "border-coke-red bg-coke-red/10" : "border-border hover:border-coke-red/30")}>
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
                            <Scales size={16} weight="bold" className="text-primary" />
                          </div>
                          Package Weight
                        </Label>
                        <WeightSelector value={weightGrams} onChange={setWeightGrams} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Country alerts */}
                {destinationCountry && !isCountryServed && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                    <Alert variant="destructive">
                      <Warning size={16} weight="bold" />
                      <AlertDescription>
                        {selectedCountry?.notServedReason || 'We do not currently ship to this destination.'}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {destinationCountry && isCountryServed && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                    <CountryRegulations countryCode={destinationCountry} />
                  </motion.div>
                )}

                {/* Carrier Results */}
                {destinationCountry && isCountryServed && courierOptions.length > 0 && (
                  <div className="mt-12 space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold font-typewriter">
                        Choose Your <span className="text-coke-red">Carrier</span>
                      </h2>
                      <p className="text-muted-foreground mt-2">Compare rates and select the best option</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {courierOptions.map((option, index) => (
                        <CarrierCard key={option.carrier} option={option}
                          isSelected={(selectedCarrier === option.carrier || (!selectedCarrier && option.isRecommended && !COMING_SOON_CARRIERS.includes(option.carrier))) && !COMING_SOON_CARRIERS.includes(option.carrier)}
                          onSelect={() => { if (!COMING_SOON_CARRIERS.includes(option.carrier)) setSelectedCarrier(option.carrier); }}
                          index={index} />
                      ))}
                    </div>
                    {/* Summary + ETA */}
                    {selectedOption && !COMING_SOON_CARRIERS.includes(selectedOption.carrier) && (
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <SummaryCard
                            title={getCarrierInfo(selectedOption.carrier).fullName}
                            price={selectedOption.price}
                            transitLabel={`${selectedOption.transitDays.min}-${selectedOption.transitDays.max} days`}
                            onBook={() => router.push('/auth')} />
                        </div>
                        <div>{eta && <ETADisplay eta={eta} />}</div>
                      </div>
                    )}
                    <ProhibitedItemsAlert countryName={selectedCountry?.name} />
                  </div>
                )}

                {/* Empty state */}
                {(!destinationCountry || courierOptions.length === 0) && isCountryServed !== false && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
                    <Card className="border-2 border-dashed">
                      <CardContent className="py-16 text-center space-y-6">
                        <motion.div animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="w-24 h-24 mx-auto rounded-3xl bg-muted flex items-center justify-center">
                          <Cube size={48} weight="bold" className="text-muted-foreground" />
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-xl font-typewriter">Ready to Calculate?</h3>
                          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Select a destination country and enter your package weight to see instant shipping rates.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-8 pt-4">
                          {[
                            { icon: Globe, label: '150+ Countries' },
                            { icon: Truck, label: '4 Carriers' },
                            { icon: Lightning, label: 'Instant Quotes' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <item.icon size={16} weight="bold" className="text-coke-red" />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══════ DOMESTIC MODE ═══════ */}
            {shippingMode === 'domestic' && (
              <motion.div key="dom" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                {/* Input Card */}
                <Card className="border-2 shadow-xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Pincodes */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-coke-red/10 flex items-center justify-center">
                            <MapPin size={16} weight="bold" className="text-coke-red" />
                          </div>
                          Pickup & Delivery Pincodes
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Pickup Pincode</Label>
                            <Input type="text" maxLength={6} placeholder="e.g. 110001" value={pickupPincode}
                              onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="text-lg font-semibold h-12 font-typewriter" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Delivery Pincode</Label>
                            <Input type="text" maxLength={6} placeholder="e.g. 400001" value={deliveryPincode}
                              onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="text-lg font-semibold h-12 font-typewriter" />
                          </div>
                        </div>
                        {/* Quick pincode presets */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Popular routes:</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Delhi → Mumbai', pickup: '110001', delivery: '400001' },
                              { label: 'Bangalore → Chennai', pickup: '560001', delivery: '600001' },
                              { label: 'Kolkata → Hyderabad', pickup: '700001', delivery: '500001' },
                            ].map((route) => (
                              <motion.button key={route.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setPickupPincode(route.pickup); setDeliveryPincode(route.delivery); }}
                                className={cn("px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all",
                                  pickupPincode === route.pickup && deliveryPincode === route.delivery
                                    ? "border-coke-red bg-coke-red/10 text-coke-red" : "border-border hover:border-coke-red/30")}>
                                {route.label}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Weight & Dimensions */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Scales size={16} weight="bold" className="text-primary" />
                          </div>
                          Package Details
                        </Label>
                        {/* Weight */}
                        <div className="space-y-2">
                          <div className="text-center py-3 bg-muted/30 rounded-lg">
                            <span className="text-4xl font-bold font-typewriter text-coke-red">{domesticWeightKg}</span>
                            <span className="text-sm text-muted-foreground ml-1">kg</span>
                          </div>
                          <input type="range" min={0.5} max={30} step={0.5} value={domesticWeightKg}
                            onChange={(e) => setDomesticWeightKg(Number(e.target.value))}
                            className="w-full accent-coke-red" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0.5 kg</span><span>30 kg</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 5, 10].map(w => (
                              <button key={w} onClick={() => setDomesticWeightKg(w)}
                                className={cn("py-2 rounded-lg border text-sm font-medium transition-all",
                                  domesticWeightKg === w ? "border-coke-red bg-coke-red/5 text-coke-red" : "border-border hover:border-coke-red/30")}>
                                {w} kg
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Dimensions */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'L (cm)', val: domesticLength, set: setDomesticLength },
                            { label: 'W (cm)', val: domesticWidth, set: setDomesticWidth },
                            { label: 'H (cm)', val: domesticHeight, set: setDomesticHeight },
                          ].map(d => (
                            <div key={d.label} className="space-y-1">
                              <Label className="text-xs">{d.label}</Label>
                              <Input type="number" min={1} max={150} value={d.val}
                                onChange={(e) => d.set(Math.max(1, Number(e.target.value) || 1))}
                                className="font-typewriter h-10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Check Rates Button */}
                    <div className="mt-6 flex justify-center">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button size="lg" onClick={fetchDomesticRates}
                          disabled={!/^\d{6}$/.test(pickupPincode) || !/^\d{6}$/.test(deliveryPincode) || domesticLoading}
                          className="h-14 px-10 text-lg bg-coke-red hover:bg-coke-red/90 shadow-lg shadow-coke-red/30 gap-2">
                          {domesticLoading ? (
                            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Checking rates...</>
                          ) : (
                            <><Truck size={20} weight="bold" /> Check Domestic Rates</>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {/* Domestic Error */}
                {domesticError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                    <Alert variant="destructive">
                      <Warning size={16} weight="bold" />
                      <AlertDescription>{domesticError}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Domestic Results */}
                {domesticCouriers.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold font-typewriter">
                        Choose Your <span className="text-coke-red">Courier</span>
                      </h2>
                      <p className="text-muted-foreground mt-2">
                        {domesticCouriers.length} option{domesticCouriers.length !== 1 ? 's' : ''} for {pickupPincode} → {deliveryPincode}
                      </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex justify-center">
                      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                        {([
                          { key: 'all' as const, label: 'All', count: domesticCouriers.length, icon: '📦' },
                          { key: 'air' as const, label: 'Air', count: airCount, icon: '✈️' },
                          { key: 'surface' as const, label: 'Surface', count: surfaceCount, icon: '🚛' },
                        ]).map(tab => (
                          <button key={tab.key} onClick={() => setDomesticFilterTab(tab.key)}
                            className={cn("flex items-center gap-1.5 py-2 px-4 rounded-md text-sm font-medium transition-all",
                              domesticFilterTab === tab.key
                                ? "bg-background text-coke-red shadow-sm"
                                : "text-muted-foreground hover:text-foreground")}>
                            <span>{tab.icon}</span> {tab.label}
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                              domesticFilterTab === tab.key ? "bg-coke-red/10 text-coke-red" : "bg-muted text-muted-foreground")}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Courier Cards */}
                    <div className="space-y-3 max-w-3xl mx-auto">
                      {filteredDomesticCouriers.map((courier, index) => (
                        <DomesticCourierCard key={courier.courier_company_id} courier={courier}
                          isSelected={selectedDomesticCourier?.courier_company_id === courier.courier_company_id}
                          onSelect={() => setSelectedDomesticCourier(courier)} index={index} />
                      ))}
                      {filteredDomesticCouriers.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No {domesticFilterTab} couriers available for this route
                        </p>
                      )}
                    </div>

                    {/* Domestic Summary */}
                    {selectedDomesticCourier && (
                      <div className="max-w-3xl mx-auto">
                        <SummaryCard
                          title={selectedDomesticCourier.courier_name}
                          price={selectedDomesticCourier.customer_price}
                          transitLabel={`${selectedDomesticCourier.estimated_delivery_days} day${selectedDomesticCourier.estimated_delivery_days !== 1 ? 's' : ''}`}
                          onBook={() => router.push('/auth')} />
                      </div>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      Prices include pickup charges. Pickup will be raised automatically after booking.
                    </p>
                  </div>
                )}

                {/* Domestic Empty State */}
                {domesticCouriers.length === 0 && !domesticLoading && !domesticError && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
                    <Card className="border-2 border-dashed">
                      <CardContent className="py-16 text-center space-y-6">
                        <motion.div animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="w-24 h-24 mx-auto rounded-3xl bg-muted flex items-center justify-center">
                          <House size={48} weight="bold" className="text-muted-foreground" />
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-xl font-typewriter">Ready to Calculate?</h3>
                          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Enter pickup and delivery pincodes, set your package weight, and hit "Check Domestic Rates" to see instant quotes.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-8 pt-4">
                          {[
                            { icon: House, label: 'Pan-India' },
                            { icon: Truck, label: 'Multiple Carriers' },
                            { icon: Lightning, label: 'Instant Quotes' },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <item.icon size={16} weight="bold" className="text-coke-red" />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PublicRateCalculator;
