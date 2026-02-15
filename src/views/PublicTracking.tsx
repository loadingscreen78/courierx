"use client";

import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, CheckCircle, Plane, Globe, Phone, Shield, ChevronDown, X, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LandingHeader, LandingFooter } from '@/components/landing';
import { useSeo } from '@/hooks/useSeo';
import { motion, AnimatePresence } from 'framer-motion';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Helper to get a future date (3 days from now)
const getFutureDeliveryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(18, 0, 0, 0);
  return date;
};

const formatDeliveryDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Mock tracking data
const mockTrackingData = {
  'CX1234567890': {
    trackingNumber: 'CX1234567890',
    status: 'in_transit',
    statusLabel: 'In Transit',
    origin: 'New Delhi, India',
    destination: 'London, UK',
    originCoords: { x: 540, y: 185 },
    destCoords: { x: 380, y: 135 },
    shipmentType: 'Medicine',
    get estimatedDelivery() { return formatDeliveryDate(getFutureDeliveryDate()); },
    get estimatedDeliveryDate() { return getFutureDeliveryDate(); },
    weight: '500g',
    progress: 65,
    distance: '6,704 km',
    flightTime: '8h 45m',
    timeline: [
      { status: 'Order Placed', date: 'Jan 1, 2026 10:30 AM', completed: true, location: 'Online' },
      { status: 'Picked Up', date: 'Jan 2, 2026 02:00 PM', completed: true, location: 'New Delhi' },
      { status: 'At Warehouse', date: 'Jan 3, 2026 09:00 AM', completed: true, location: 'Delhi Hub' },
      { status: 'QC Passed', date: 'Jan 3, 2026 03:00 PM', completed: true, location: 'Delhi Hub' },
      { status: 'In Transit', date: 'Jan 4, 2026 11:00 AM', completed: true, location: 'International', current: true },
      { status: 'Customs Clearance', date: 'Expected Jan 5', completed: false, location: 'London' },
      { status: 'Out for Delivery', date: 'Expected Jan 6', completed: false, location: 'London' },
      { status: 'Delivered', date: 'Expected Jan 7', completed: false, location: 'London' },
    ],
  },
};

// Mock phone data
const mockPhoneData: Record<string, string> = {
  '9876543210': 'CX1234567890',
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {timeUnits.map((unit, i) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              key={unit.value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-b from-coke-red to-coke-red/80 text-white rounded-xl p-4 shadow-lg shadow-coke-red/20"
            >
              <span className="text-3xl md:text-4xl font-bold font-typewriter">
                {String(unit.value).padStart(2, '0')}
              </span>
            </motion.div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-coke-red/30 rounded-full blur-sm" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 font-medium uppercase tracking-wide">
            {unit.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
};

// Accurate World Map SVG Component
const WorldMap = ({ origin, destination, progress }: { 
  origin: { x: number; y: number }; 
  destination: { x: number; y: number }; 
  progress: number 
}) => {
  const [planePos, setPlanePos] = useState(0);

  // Animate plane continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setPlanePos(prev => (prev >= progress ? 0 : prev + 0.5));
    }, 50);
    return () => clearInterval(interval);
  }, [progress]);

  // Calculate curved path control point
  const midX = (origin.x + destination.x) / 2;
  const midY = Math.min(origin.y, destination.y) - 60;
  
  // Calculate plane position on curve
  const t = planePos / 100;
  const planeX = (1-t)*(1-t)*origin.x + 2*(1-t)*t*midX + t*t*destination.x;
  const planeY = (1-t)*(1-t)*origin.y + 2*(1-t)*t*midY + t*t*destination.y;
  
  // Calculate plane angle
  const dx = 2*(1-t)*(midX-origin.x) + 2*t*(destination.x-midX);
  const dy = 2*(1-t)*(midY-origin.y) + 2*t*(destination.y-midY);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-background border border-border">
      <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="flightPath" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--coke-red))" stopOpacity="1"/>
            <stop offset="100%" stopColor="hsl(var(--coke-red))" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        
        {/* World Map - Accurate continents */}
        <g className="fill-muted-foreground/20 dark:fill-muted-foreground/30">
          {/* North America */}
          <path d="M40,100 Q80,80 140,90 Q180,100 200,130 Q210,160 190,190 Q160,210 120,200 Q80,190 60,160 Q40,130 40,100Z"/>
          {/* South America */}
          <path d="M150,220 Q180,210 200,230 Q220,270 210,320 Q190,360 160,370 Q130,360 120,320 Q120,270 150,220Z"/>
          {/* Europe */}
          <path d="M340,80 Q380,70 420,80 Q450,100 440,130 Q420,150 380,145 Q350,140 340,120 Q335,100 340,80Z"/>
          {/* Africa */}
          <path d="M360,160 Q400,150 440,170 Q470,210 460,280 Q440,340 400,360 Q360,350 340,300 Q330,240 360,160Z"/>
          {/* Asia */}
          <path d="M450,60 Q520,50 600,70 Q680,100 720,150 Q740,200 700,250 Q640,280 560,260 Q480,240 460,180 Q440,120 450,60Z"/>
          {/* India */}
          <path d="M520,170 Q550,160 570,180 Q580,220 560,260 Q530,280 510,260 Q500,220 520,170Z" className="fill-muted-foreground/30 dark:fill-muted-foreground/40"/>
          {/* Australia */}
          <path d="M620,290 Q680,280 720,300 Q740,330 720,360 Q680,380 640,370 Q610,350 620,290Z"/>
          {/* UK */}
          <path d="M365,95 Q380,90 390,100 Q395,115 385,125 Q370,130 365,115 Q360,105 365,95Z" className="fill-muted-foreground/30 dark:fill-muted-foreground/40"/>
        </g>

        {/* Grid lines */}
        <g className="stroke-border" strokeWidth="0.5" opacity="0.3">
          {[100, 200, 300].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} />)}
          {[200, 400, 600].map(x => <line key={x} x1={x} y1="0" x2={x} y2="400" />)}
        </g>

        {/* Flight path - dashed background */}
        <path
          d={`M${origin.x},${origin.y} Q${midX},${midY} ${destination.x},${destination.y}`}
          fill="none"
          className="stroke-muted-foreground/30"
          strokeWidth="2"
          strokeDasharray="8 8"
        />

        {/* Flight path - animated red line */}
        <motion.path
          d={`M${origin.x},${origin.y} Q${midX},${midY} ${destination.x},${destination.y}`}
          fill="none"
          stroke="hsl(var(--coke-red))"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Origin point - New Delhi */}
        <g>
          <circle cx={origin.x} cy={origin.y} r="8" className="fill-coke-red" />
          <motion.circle
            cx={origin.x} cy={origin.y} r="12"
            fill="none" stroke="hsl(var(--coke-red))" strokeWidth="2"
            animate={{ r: [12, 20, 12], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <text x={origin.x + 15} y={origin.y + 5} className="fill-foreground text-xs font-medium">New Delhi</text>
        </g>

        {/* Destination point - London */}
        <g>
          <circle cx={destination.x} cy={destination.y} r="8" className="fill-foreground" />
          <circle cx={destination.x} cy={destination.y} r="12" fill="none" className="stroke-foreground" strokeWidth="2" opacity="0.3" />
          <text x={destination.x - 50} y={destination.y - 15} className="fill-foreground text-xs font-medium">London</text>
        </g>

        {/* Animated Plane */}
        {planePos < progress && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <g transform={`translate(${planeX}, ${planeY}) rotate(${angle})`}>
              <path 
                d="M-12,0 L-4,-3 L8,0 L-4,3 Z M-8,-2 L-8,2 M4,-6 L4,6" 
                className="fill-coke-red stroke-coke-red"
                strokeWidth="1"
              />
            </g>
            {/* Trail effect */}
            <motion.circle
              cx={planeX - 15 * Math.cos(angle * Math.PI / 180)}
              cy={planeY - 15 * Math.sin(angle * Math.PI / 180)}
              r="4"
              className="fill-coke-red/50"
              animate={{ opacity: [0.5, 0], r: [4, 8] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.g>
        )}
      </svg>

      {/* Distance overlay */}
      <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Distance: </span>
            <span className="font-semibold text-foreground">6,704 km</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div>
            <span className="text-muted-foreground">Flight: </span>
            <span className="font-semibold text-foreground">~8h 45m</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// OTP Verification Modal
const OTPModal = ({ 
  phone, 
  onVerify, 
  onClose 
}: { 
  phone: string; 
  onVerify: (otp: string) => void; 
  onClose: () => void;
}) => {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold font-typewriter text-foreground">Verify Your Number</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit OTP sent to +91 {phone.slice(0, 2)}****{phone.slice(-2)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          Demo OTP: <span className="font-mono font-bold text-coke-red">123456</span>
        </p>

        <Button 
          className="w-full h-12 bg-coke-red hover:bg-coke-red/90"
          onClick={() => onVerify(otp)}
          disabled={otp.length !== 6}
        >
          <Shield className="h-5 w-5 mr-2" />
          Verify & Track
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {resendTimer > 0 ? (
            <>Resend OTP in <span className="font-semibold">{resendTimer}s</span></>
          ) : (
            <button className="text-coke-red hover:underline" onClick={() => setResendTimer(30)}>
              Resend OTP
            </button>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};

const PublicTracking = () => {
  const [searchMode, setSearchMode] = useState<'tracking' | 'phone'>('tracking');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [trackingResult, setTrackingResult] = useState<typeof mockTrackingData['CX1234567890'] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useSeo({
    title: 'Track Your Shipment | CourierX',
    description: 'Track your international shipment from India with real-time updates.',
    canonicalPath: '/public/track',
  });

  const handleTrackByNumber = () => {
    setLoading(true);
    setError('');
    setTrackingResult(null);

    setTimeout(() => {
      const result = mockTrackingData[trackingNumber.toUpperCase() as keyof typeof mockTrackingData];
      if (result) {
        setTrackingResult(result);
      } else {
        setError('No shipment found with this tracking number.');
      }
      setLoading(false);
    }, 800);
  };

  const handlePhoneSearch = () => {
    setError('');
    const trackingId = mockPhoneData[phoneNumber];
    if (trackingId) {
      setShowOTP(true);
    } else {
      setError('No shipment found for this phone number.');
    }
  };

  const handleOTPVerify = (otp: string) => {
    if (otp === '123456') {
      setShowOTP(false);
      const trackingId = mockPhoneData[phoneNumber];
      if (trackingId) {
        setTrackingNumber(trackingId);
        const result = mockTrackingData[trackingId as keyof typeof mockTrackingData];
        setTrackingResult(result);
      }
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      
      {/* OTP Modal */}
      <AnimatePresence>
        {showOTP && (
          <OTPModal 
            phone={phoneNumber} 
            onVerify={handleOTPVerify} 
            onClose={() => setShowOTP(false)} 
          />
        )}
      </AnimatePresence>

      <main className="flex-1 py-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coke-red/10 text-coke-red mb-6"
            >
              <Globe className="h-5 w-5" />
              <span className="font-semibold text-sm">Real-Time Tracking</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold font-typewriter text-foreground mb-4">
              Track Your Shipment
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Enter your tracking number or phone for instant updates.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="max-w-2xl mx-auto">
              {/* Main Search */}
              <div className="p-2 rounded-2xl bg-card border border-border shadow-lg dark:shadow-none">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Enter tracking number (e.g., CX1234567890)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrackByNumber()}
                    className="flex-1 h-14 text-lg border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                  <Button 
                    size="lg" 
                    className="h-14 px-10 gap-2 bg-coke-red hover:bg-coke-red/90 text-white font-semibold rounded-xl shadow-lg shadow-coke-red/25 hover:shadow-xl hover:shadow-coke-red/30 active:shadow-md transition-all duration-150"
                    onClick={handleTrackByNumber}
                    disabled={!trackingNumber.trim() || loading}
                  >
                    <Search className="h-5 w-5" />
                    {loading ? 'Tracking...' : 'Track'}
                  </Button>
                </div>
              </div>

              {/* Advanced Search Toggle */}
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Advanced Search</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Advanced Search - Phone */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-6 rounded-2xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Phone className="h-5 w-5 text-coke-red" />
                        <span className="font-semibold text-foreground">Search by Phone Number</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter the phone number used during booking. We'll send an OTP for verification.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex">
                          <span className="inline-flex items-center px-4 rounded-l-xl bg-muted border border-r-0 border-border text-muted-foreground">
                            +91
                          </span>
                          <Input
                            placeholder="Enter 10-digit mobile number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="flex-1 h-12 rounded-l-none border-l-0"
                          />
                        </div>
                        <Button 
                          className="h-12 px-6 bg-foreground hover:bg-foreground/90 text-background"
                          onClick={handlePhoneSearch}
                          disabled={phoneNumber.length !== 10}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Send OTP
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Demo: Try phone <button onClick={() => setPhoneNumber('9876543210')} className="text-coke-red hover:underline font-medium">9876543210</button>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Demo: Try <button onClick={() => setTrackingNumber('CX1234567890')} className="text-coke-red hover:underline font-medium">CX1234567890</button>
              </p>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tracking Result */}
          <AnimatePresence>
            {trackingResult && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-5 gap-8"
              >
                {/* Left - Timeline */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                  <Card className="border-border shadow-lg dark:shadow-none rounded-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-bold font-typewriter text-foreground mb-8">
                        Shipment Timeline
                      </h3>
                      <div className="space-y-1">
                        {trackingResult.timeline.map((step, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <motion.div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                                  step.current 
                                    ? 'bg-coke-red text-white' 
                                    : step.completed 
                                      ? 'bg-foreground text-background' 
                                      : 'bg-muted text-muted-foreground border-2 border-border'
                                }`}
                                animate={step.current ? { 
                                  boxShadow: ['0 0 0 0 rgba(244,0,0,0.4)', '0 0 0 12px rgba(244,0,0,0)', '0 0 0 0 rgba(244,0,0,0.4)']
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                {step.completed ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-current" />
                                )}
                              </motion.div>
                              {index < trackingResult.timeline.length - 1 && (
                                <div className={`w-0.5 h-12 ${
                                  step.completed ? 'bg-foreground' : 'bg-border'
                                }`} />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className={`font-semibold ${
                                step.current ? 'text-coke-red' : step.completed ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {step.status}
                              </p>
                              <p className="text-sm text-muted-foreground">{step.date}</p>
                              <p className="text-xs text-muted-foreground/70">{step.location}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right - Map & Details */}
                <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
                  {/* Expected Delivery Banner */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-coke-red via-coke-red to-coke-red/90 p-6 text-white shadow-xl shadow-coke-red/20"
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20h20v20H20V20zm0-20h20v20H20V0zM0 20h20v20H0V20zM0 0h20v20H0V0z'/%3E%3C/g%3E%3C/svg%3E")`,
                      }} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <Calendar className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-white/80 text-sm font-medium">Expected Delivery</p>
                          <p className="text-2xl md:text-3xl font-bold font-typewriter">
                            {trackingResult.estimatedDelivery}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">Delivering to</p>
                        <p className="font-semibold">{trackingResult.destination}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Countdown Timer */}
                  <Card className="border-border shadow-lg dark:shadow-none rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold font-typewriter text-foreground mb-1">
                          Arriving In
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your package is on its way!
                        </p>
                      </div>
                      <CountdownTimer targetDate={trackingResult.estimatedDeliveryDate} />
                    </CardContent>
                  </Card>

                  {/* Status Header */}
                  <Card className="border-border shadow-lg dark:shadow-none rounded-2xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                          <p className="text-2xl font-bold font-typewriter text-foreground">
                            {trackingResult.trackingNumber}
                          </p>
                        </div>
                        <motion.div 
                          className="px-5 py-2.5 rounded-full bg-coke-red/10 text-coke-red font-semibold"
                          animate={{ 
                            boxShadow: ['0 0 0 0 rgba(244,0,0,0.2)', '0 0 0 8px rgba(244,0,0,0)', '0 0 0 0 rgba(244,0,0,0.2)']
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {trackingResult.statusLabel}
                        </motion.div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Delivery Progress</span>
                          <span className="font-semibold text-foreground">{trackingResult.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-coke-red to-coke-red/70 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${trackingResult.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { icon: MapPin, label: 'From', value: trackingResult.origin, color: 'text-foreground' },
                          { icon: MapPin, label: 'To', value: trackingResult.destination, color: 'text-coke-red' },
                          { icon: Package, label: 'Type', value: trackingResult.shipmentType, color: 'text-foreground' },
                          { icon: Clock, label: 'Est. Delivery', value: trackingResult.estimatedDelivery, color: 'text-candlestick-green' },
                        ].map((item, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="p-4 rounded-xl bg-muted/50"
                          >
                            <item.icon className={`h-5 w-5 ${item.color} mb-2`} />
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className={`font-semibold text-sm ${item.color}`}>{item.value}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Map */}
                  <Card className="border-border shadow-lg dark:shadow-none rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Plane className="h-5 w-5 text-coke-red" />
                        <h3 className="font-bold text-foreground">Live Tracking</h3>
                      </div>
                      <WorldMap 
                        origin={trackingResult.originCoords}
                        destination={trackingResult.destCoords}
                        progress={trackingResult.progress}
                      />
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default PublicTracking;
