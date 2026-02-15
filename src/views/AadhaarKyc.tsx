"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, ArrowRight, Loader2, CheckCircle2, MapPin, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import logoMain from '@/assets/logo-main.jpeg';

// MOCK MODE: Disabled Verhoeff validation - accepts any 12-digit number
// TODO: Re-enable Verhoeff validation when connecting real KYC API
const validateVerhoeff = (num: string): boolean => {
  // Mock mode: Accept any 12-digit number
  return num.length === 12 && /^\d+$/.test(num);
};

// Format Aadhaar for display (XXXX XXXX XXXX)
const formatAadhaar = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
};

// Generate mock address based on Aadhaar prefix (simulated)
const generateMockAddress = (aadhaarPrefix: string): string => {
  const stateMap: Record<string, string> = {
    '2': 'Maharashtra',
    '3': 'Gujarat',
    '4': 'Karnataka',
    '5': 'Tamil Nadu',
    '6': 'Andhra Pradesh',
    '7': 'West Bengal',
    '8': 'Delhi',
    '9': 'Uttar Pradesh',
  };
  
  const state = stateMap[aadhaarPrefix[0]] || 'India';
  const houseNo = Math.floor(Math.random() * 500) + 1;
  const streets = ['Gandhi Nagar', 'Nehru Street', 'MG Road', 'Station Road', 'Temple Lane'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const pincode = `${aadhaarPrefix[0]}${Math.floor(Math.random() * 90000) + 10000}`;
  
  return `${houseNo}, ${street}, ${state} - ${pincode}`;
};

// MOCK MODE: Simplified validation - accepts any 12-digit number
const aadhaarSchema = z.object({
  aadhaarNumber: z.string()
    .regex(/^[0-9]{12}$/, 'Aadhaar number must be exactly 12 digits'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Please enter a 6-digit OTP'),
});

type AadhaarFormValues = z.infer<typeof aadhaarSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type KycStep = 'aadhaar' | 'otp' | 'success';

const RESEND_COOLDOWN = 30; // seconds

const AadhaarKyc = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, completeAadhaarKyc, loading } = useAuth();
  const { toast } = useToast();
  const { successFeedback, heavyTap } = useHaptics();
  const { playSuccess } = useSoundEffects();
  
  const [step, setStep] = useState<KycStep>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [formattedAadhaar, setFormattedAadhaar] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const from = searchParams.get('from') || '/';

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If already verified, redirect
  useEffect(() => {
    if (!loading && profile?.aadhaar_verified) {
      router.replace(from);
    }
  }, [profile, loading, router, from]);

  const aadhaarForm = useForm<AadhaarFormValues>({
    resolver: zodResolver(aadhaarSchema),
    defaultValues: { aadhaarNumber: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setFormattedAadhaar(formatAadhaar(value));
    aadhaarForm.setValue('aadhaarNumber', value);
  };

  const handleSendAadhaarOtp = async (values: AadhaarFormValues) => {
    setIsLoading(true);
    heavyTap();
    
    // MOCK MODE: Simulate OTP send (no real API call)
    console.log('[KYC Mock] Simulating OTP send for Aadhaar:', values.aadhaarNumber);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    setAadhaarNumber(values.aadhaarNumber);
    setStep('otp');
    setResendCooldown(RESEND_COOLDOWN);
    
    toast({
      title: 'OTP Sent (Mock)',
      description: 'Enter any 6-digit code to continue (mock mode).',
    });
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    heavyTap();
    
    // MOCK MODE: Simulate OTP resend
    console.log('[KYC Mock] Simulating OTP resend');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
    setResendCooldown(RESEND_COOLDOWN);
    
    toast({
      title: 'OTP Resent (Mock)',
      description: 'Enter any 6-digit code to continue (mock mode).',
    });
  };

  const handleVerifyAadhaarOtp = async (values: OtpFormValues) => {
    setIsLoading(true);
    
    // MOCK MODE: Generate mock address and auto-complete KYC
    console.log('[KYC Mock] Verifying OTP (any 6-digit code accepted)');
    const mockAddress = generateMockAddress(aadhaarNumber);
    const { error, address } = await completeAadhaarKyc(aadhaarNumber, values.otp);
    
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'KYC verification failed. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    successFeedback();
    playSuccess();
    setVerifiedAddress(address || mockAddress);
    setStep('success');
    
    toast({
      title: 'KYC Complete (Mock)',
      description: 'Your identity has been verified successfully.',
    });
  };

  const handleContinue = () => {
    heavyTap();
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logoMain.src} alt="CourierX" className="h-16 w-auto rounded-lg" />
          <h1 className="font-typewriter text-2xl font-bold text-foreground">CourierX</h1>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-typewriter text-xl flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Aadhaar KYC Verification
            </CardTitle>
            <CardDescription>
              {step === 'aadhaar' && 'Mock Mode: Enter any 12-digit number'}
              {step === 'otp' && 'Mock Mode: Enter any 6-digit code'}
              {step === 'success' && 'Your identity has been verified successfully'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'aadhaar' && (
              <Form {...aadhaarForm}>
                <form onSubmit={aadhaarForm.handleSubmit(handleSendAadhaarOtp)} className="space-y-4">
                  <FormField
                    control={aadhaarForm.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={14}
                            placeholder="XXXX XXXX XXXX"
                            className="input-premium font-mono tracking-widest text-center text-lg"
                            value={formattedAadhaar}
                            onChange={handleAadhaarChange}
                          />
                        </FormControl>
                        <input type="hidden" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Mock Mode:</strong> Enter any 12-digit number to continue. 
                      Real Aadhaar verification will be enabled in production.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    type="submit" 
                    className="w-full btn-press" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Verify Aadhaar
                  </Button>
                </form>
              </Form>
            )}

            {step === 'otp' && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleVerifyAadhaarOtp)} className="space-y-6">
                  {/* Display masked Aadhaar */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Verifying Aadhaar: <span className="font-mono font-semibold">XXXX XXXX {aadhaarNumber.slice(-4)}</span>
                    </p>
                  </div>

                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="sr-only">Aadhaar OTP</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full btn-press" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Complete KYC
                    </Button>
                    
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStep('aadhaar');
                          setFormattedAadhaar('');
                          aadhaarForm.reset();
                        }}
                      >
                        Change Aadhaar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || isLoading}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}

            {step === 'success' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-accent-foreground" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-typewriter font-semibold">Verification Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    Your Aadhaar has been verified successfully.
                  </p>
                </div>
                
                <div className="bg-secondary/50 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Registered Sender Address</p>
                      <p className="text-sm font-medium">{verifiedAddress}</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This address will be used for all customs declarations and cannot be changed.
                </p>
                
                <Button onClick={handleContinue} className="w-full btn-press">
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AadhaarKyc;


