"use client";

import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface KycPromptBannerProps {
  userName?: string;
}

export const KycPromptBanner = ({ userName }: KycPromptBannerProps) => {
  const router = useRouter();
  const { mediumTap } = useHaptics();
  const { playClick } = useSoundEffects();

  const handleVerifyClick = () => {
    mediumTap();
    playClick();
    router.push('/auth/kyc');
  };

  return (
    <Alert className="border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <AlertTitle className="font-typewriter text-foreground">
        Complete Your Verification
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          {userName ? `Hi ${userName}! ` : ''}
          To start shipping internationally, please verify your identity using Aadhaar. 
          This one-time verification is required for CSB IV compliance.
        </p>
        <Button 
          onClick={handleVerifyClick}
          variant="destructive"
          size="sm"
          className="btn-press"
        >
          <Shield className="h-4 w-4 mr-2" />
          Verify Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
