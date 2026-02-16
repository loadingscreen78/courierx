import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDraft } from '@/hooks/useDraft';
import { formatRelativeTime } from '@/lib/drafts/draftService';
import { AppLayout } from '@/components/layout';
import { DocumentDetailsStep } from '@/components/booking/document/DocumentDetailsStep';
import { DocumentAddressStep } from '@/components/booking/document/DocumentAddressStep';
import { DocumentAddonsStep } from '@/components/booking/document/DocumentAddonsStep';
import { DocumentReviewStep } from '@/components/booking/document/DocumentReviewStep';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createDocumentShipment } from '@/lib/shipments/documentShipmentService';
import { toast } from 'sonner';

export interface DocumentBookingData {
  // Document Details
  packetType: 'envelope' | 'small-packet' | 'large-packet' | 'tube' | '';
  documentType: string;
  description: string;
  weight: number; // in grams
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm

  // Addresses
  pickupAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
  };
  consigneeAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
    zipcode: string;
  };

  // Add-ons
  insurance: boolean;
  waterproofPackaging: boolean;
}

const initialBookingData: DocumentBookingData = {
  packetType: '',
  documentType: '',
  description: '',
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  pickupAddress: {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  },
  consigneeAddress: {
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: '',
    zipcode: '',
  },
  insurance: false,
  waterproofPackaging: false,
};

const STEPS = [
  { id: 1, title: 'Document Details', description: 'Type and dimensions' },
  { id: 2, title: 'Addresses', description: 'Pickup & delivery' },
  { id: 3, title: 'Add-ons', description: 'Protection options' },
  { id: 4, title: 'Review', description: 'Confirm booking' },
];

const DocumentBooking = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { deductFundsForShipment, refreshBalance } = useWallet();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');

  const {
    data: bookingData,
    currentStep,
    lastSaved,
    isSaving,
    setData,
    setStep,
    saveNow,
    discardDraft,
  } = useDraft<DocumentBookingData>({
    type: 'document',
    initialData: initialBookingData,
    totalSteps: STEPS.length,
    draftId,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mediumTap, errorFeedback, successFeedback } = useHaptics();
  const { playClick, playError, playSuccess } = useSoundEffects();

  const updateBookingData = useCallback((updates: Partial<DocumentBookingData>) => {
    setData(prev => {
      // Only update if values actually changed
      const hasChanges = Object.keys(updates).some(key => {
        const k = key as keyof DocumentBookingData;
        return JSON.stringify(prev[k]) !== JSON.stringify(updates[k]);
      });

      if (!hasChanges) return prev;

      return { ...prev, ...updates };
    });
    // Only clear errors if there were errors
    setValidationErrors(prev => prev.length > 0 ? [] : prev);
  }, [setData]);

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!bookingData.packetType) errors.push('Please select packet type');
        if (!bookingData.documentType.trim()) errors.push('Please specify document type');
        if (bookingData.weight <= 0) errors.push('Weight must be greater than 0');
        if (bookingData.weight > 2000) errors.push('Weight cannot exceed 2000 grams');
        break;
      case 2:
        if (!bookingData.pickupAddress.fullName.trim()) errors.push('Please enter pickup contact name');
        if (!bookingData.pickupAddress.phone.trim()) errors.push('Please enter pickup phone number');
        if (!bookingData.pickupAddress.addressLine1.trim()) errors.push('Please enter pickup address');
        if (!bookingData.pickupAddress.pincode.trim() || bookingData.pickupAddress.pincode.length !== 6) {
          errors.push('Please enter valid 6-digit pincode');
        }
        if (!bookingData.consigneeAddress.fullName.trim()) errors.push('Please enter consignee name');
        if (!bookingData.consigneeAddress.country.trim()) errors.push('Please select destination country');
        if (!bookingData.consigneeAddress.addressLine1.trim()) errors.push('Please enter consignee address');
        break;
    }

    setValidationErrors(errors);
    if (errors.length > 0) {
      errorFeedback();
      playError();
    }
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      mediumTap();
      playClick();
      setStep(Math.min(currentStep + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    mediumTap();
    playClick();
    setStep(Math.max(currentStep - 1, 1));
    // Only clear errors if there were errors
    setValidationErrors(prev => prev.length > 0 ? [] : prev);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      router.push('/auth');
      return;
    }

    setIsSubmitting(true);
    mediumTap();

    try {
      console.log('[DocumentBooking] Submitting booking data...');

      // Create shipment first
      const result = await createDocumentShipment({
        bookingData,
        userId: user.id,
      });

      if (result.success && result.shipmentId) {
        // Calculate total amount (same as in service)
        const weightInKg = bookingData.weight / 1000;
        const volumetricWeight = (bookingData.length * bookingData.width * bookingData.height) / 5000;
        const chargeableWeight = Math.max(weightInKg, volumetricWeight);
        const baseRatePerKg = 500;
        const packetMultiplier: Record<string, number> = {
          'envelope': 1.0,
          'small-packet': 1.2,
          'large-packet': 1.5,
          'tube': 1.3,
        };
        const multiplier = packetMultiplier[bookingData.packetType] || 1.0;
        let totalAmount = Math.ceil(chargeableWeight * baseRatePerKg * multiplier);

        if (bookingData.insurance) totalAmount += 100;
        if (bookingData.waterproofPackaging) totalAmount += 50;

        // Deduct funds from wallet
        console.log('[DocumentBooking] Deducting funds from wallet...');

        const walletResult = await deductFundsForShipment(
          totalAmount,
          result.shipmentId,
          `Document shipment to ${bookingData.consigneeAddress.country}`
        );

        if (!walletResult.success) {
          console.error('[DocumentBooking] Wallet deduction failed:', walletResult.error);
          toast.error('Payment Failed', {
            description: walletResult.error || 'Failed to deduct from wallet',
          });
          setIsSubmitting(false);
          return;
        }

        // Refresh wallet balance
        await refreshBalance();

        successFeedback();
        playSuccess();

        toast.success('Booking Confirmed!', {
          description: `Tracking Number: ${result.trackingNumber}`,
        });

        // Redirect to shipments page
        setTimeout(() => {
          router.push(`/shipments`);
        }, 1500);
      } else {
        errorFeedback();
        playError();
        toast.error('Booking Failed', {
          description: result.error || 'Failed to create shipment. Please try again.',
        });
      }
    } catch (error) {
      errorFeedback();
      playError();
      console.error('[DocumentBooking] Error:', error);
      toast.error('Unexpected Error', {
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DocumentDetailsStep data={bookingData} onUpdate={updateBookingData} />;
      case 2:
        return <DocumentAddressStep data={bookingData} onUpdate={updateBookingData} />;
      case 3:
        return <DocumentAddonsStep data={bookingData} onUpdate={updateBookingData} />;
      case 4:
        return <DocumentReviewStep data={bookingData} onConfirmBooking={handleConfirmBooking} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="btn-press">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ship Documents</h1>
            <p className="text-muted-foreground text-sm">Important documents and certificates</p>
          </div>
        </div>

        <BookingProgress steps={STEPS} currentStep={currentStep} />

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please fix the following errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-xl border border-border p-6">
          {renderStep()}
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1} className="btn-press">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm & Pay
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <span>Saving...</span>
          ) : lastSaved ? (
            <span>Draft saved {formatRelativeTime(lastSaved.toISOString())}</span>
          ) : (
            <span>Your progress is auto-saved as a draft for 30 days</span>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentBooking;
