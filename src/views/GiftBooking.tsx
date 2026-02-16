import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { GiftItemsStep } from '@/components/booking/gift/GiftItemsStep';
import { GiftValidationStep } from '@/components/booking/gift/GiftValidationStep';
import { GiftAddressStep } from '@/components/booking/gift/GiftAddressStep';
import { GiftAddonsStep } from '@/components/booking/gift/GiftAddonsStep';
import { GiftReviewStep } from '@/components/booking/gift/GiftReviewStep';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, AlertCircle, Ban, Save, Clock, Trash2, Loader2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDraft } from '@/hooks/useDraft';
import { formatRelativeTime } from '@/lib/drafts/draftService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createGiftShipment } from '@/lib/shipments/giftShipmentService';
import { toast } from 'sonner';

export interface GiftItem {
  id: string;
  name: string;
  description: string;
  units: number;
  unitPrice: number;
  hsnCode: string;
}

export interface SafetyChecklist {
  containsBattery: boolean;
  containsChemical: boolean;
  containsLiquid: boolean;
  containsImitationJewellery: boolean;
}

export interface GiftBookingData {
  items: GiftItem[];
  safetyChecklist: SafetyChecklist;
  prohibitedItemAttempted: boolean;
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
  passportPhotoPage: File | null;
  passportAddressPage: File | null;
  insurance: boolean;
  giftWrapping: boolean;
}

const initialBookingData: GiftBookingData = {
  items: [],
  safetyChecklist: {
    containsBattery: false,
    containsChemical: false,
    containsLiquid: false,
    containsImitationJewellery: false,
  },
  prohibitedItemAttempted: false,
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
  passportPhotoPage: null,
  passportAddressPage: null,
  insurance: false,
  giftWrapping: false,
};

const STEPS = [
  { id: 1, title: 'Gift Items', description: 'Add items to ship' },
  { id: 2, title: 'Addresses', description: 'Pickup & delivery' },
  { id: 3, title: 'Add-ons', description: 'Extra services' },
  { id: 4, title: 'Validation', description: 'Customs check' },
  { id: 5, title: 'Review', description: 'Confirm booking' },
];

const GiftBooking = () => {
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
    hasDraft,
  } = useDraft<GiftBookingData>({
    type: 'gift',
    initialData: initialBookingData,
    totalSteps: STEPS.length,
    draftId,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mediumTap, errorFeedback, successFeedback } = useHaptics();
  const { playClick, playError, playSuccess } = useSoundEffects();
  const { user } = useAuth();
  const { deductFundsForShipment, availableBalance } = useWallet();
  const router = useRouter();

  const totalValue = bookingData.items.reduce((sum, item) => sum + (item.units * item.unitPrice), 0);
  const isOverValueCap = totalValue > 25000;

  // Pre-fill from rate calculator if available
  useEffect(() => {
    const rateCalculatorData = localStorage.getItem('rateCalculatorBooking');

    if (rateCalculatorData) {
      try {
        const data = JSON.parse(rateCalculatorData);

        // Check if data is recent (within 30 minutes)
        const isRecent = Date.now() - data.timestamp < 30 * 60 * 1000;

        if (isRecent && data.destinationCountry && data.weightGrams) {
          // Pre-fill destination country
          setData(prev => ({
            ...prev,
            consigneeAddress: {
              ...prev.consigneeAddress,
              country: data.destinationCountry
            }
          }));

          toast.success('Rate Calculator Data Loaded', {
            description: `Destination: ${data.destinationCountry}, Weight: ${data.weightGrams}g`
          });

          // Clean up after using
          localStorage.removeItem('rateCalculatorBooking');
        }
      } catch (error) {
        console.error('Error parsing rate calculator data:', error);
      }
    }
  }, [setData]);

  const updateBookingData = useCallback((updates: Partial<GiftBookingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setValidationErrors([]);
  }, [setData]);

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (bookingData.items.length === 0) errors.push('Please add at least one item');
        bookingData.items.forEach((item, index) => {
          if (!item.name.trim()) errors.push(`Item ${index + 1}: Please enter item name`);
          if (item.units <= 0) errors.push(`Item ${index + 1}: Units must be greater than 0`);
          if (item.unitPrice <= 0) errors.push(`Item ${index + 1}: Price must be greater than 0`);
          if (!item.hsnCode || item.hsnCode.length !== 8) errors.push(`Item ${index + 1}: HSN code must be 8 digits`);
        });
        if (isOverValueCap) errors.push('Total value exceeds ₹25,000 limit. Please contact support.');
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
      case 3:
        break;
      case 4:
        // Validation step - only block if explicitly marked as prohibited
        if (bookingData.prohibitedItemAttempted) {
          errors.push('Prohibited items detected. This shipment cannot proceed.');
        }
        // Note: HSN validation warnings don't block progression
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
    setValidationErrors([]);
  };

  const handleDiscard = () => {
    discardDraft();
    setShowDiscardDialog(false);
    setValidationErrors([]);
  };

  const handleConfirmAndPay = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    setIsProcessing(true);
    mediumTap();

    try {
      // Calculate total amount (matching GiftReviewStep pricing)
      const itemCount = bookingData.items.length;
      const country = bookingData.consigneeAddress.country;
      const isGCC = country === 'AE' || country === 'SA';

      const basePrice = isGCC ? 1450 : 1850;
      const shippingPrice = basePrice + (itemCount > 3 ? (itemCount - 3) * 100 : 0);

      let totalAmount = shippingPrice;
      if (bookingData.insurance) totalAmount += 150;
      if (bookingData.giftWrapping) totalAmount += 100;

      console.log('[GiftBooking] Total amount:', totalAmount);

      // Check wallet balance
      console.log('[GiftBooking] Available balance:', availableBalance);

      if (availableBalance < totalAmount) {
        toast.error(`Insufficient balance. Available: ₹${availableBalance.toLocaleString('en-IN')}`);
        errorFeedback();
        playError();
        setIsProcessing(false);
        return;
      }

      // Transform data to match service interface
      const serviceData = {
        items: bookingData.items.map(item => ({
          id: item.id,
          itemName: item.name,
          hsnCode: item.hsnCode,
          description: item.description,
          quantity: item.units,
          unitPrice: item.unitPrice,
          totalValue: item.units * item.unitPrice,
        })),
        pickupAddress: bookingData.pickupAddress,
        consigneeAddress: bookingData.consigneeAddress,
        insurance: bookingData.insurance,
        giftWrapping: bookingData.giftWrapping,
        passportPhotoPage: bookingData.passportPhotoPage,
        passportAddressPage: bookingData.passportAddressPage,
      };

      // Create shipment
      console.log('[GiftBooking] Creating shipment...');
      const result = await createGiftShipment({
        bookingData: serviceData,
        userId: user.id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create shipment');
      }

      console.log('[GiftBooking] Shipment created:', result.shipmentId);

      // Deduct from wallet using WalletContext
      console.log('[GiftBooking] Deducting from wallet...');
      const deductResult = await deductFundsForShipment(
        totalAmount,
        result.shipmentId!,
        `Gift shipment - ${result.trackingNumber}`
      );

      if (!deductResult.success) {
        throw new Error(deductResult.error || 'Failed to deduct from wallet');
      }

      console.log('[GiftBooking] Wallet deducted successfully');

      // Success!
      successFeedback();
      playSuccess();
      toast.success('Booking confirmed! Redirecting to dashboard...');

      // Discard draft
      discardDraft();

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('[GiftBooking] Error:', error);
      toast.error(error.message || 'Booking failed. Please try again.');
      errorFeedback();
      playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <GiftItemsStep data={bookingData} onUpdate={updateBookingData} totalValue={totalValue} />;
      case 2:
        return <GiftAddressStep data={bookingData} onUpdate={updateBookingData} />;
      case 3:
        return <GiftAddonsStep data={bookingData} onUpdate={updateBookingData} />;
      case 4:
        return <GiftValidationStep data={bookingData} onUpdate={updateBookingData} />;
      case 5:
        return <GiftReviewStep data={bookingData} totalValue={totalValue} />;
      default:
        return null;
    }
  };

  const hasBlockingIssue = (currentStep === 1 && isOverValueCap) ||
    (currentStep === 4 && bookingData.prohibitedItemAttempted);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="btn-press">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Ship Gifts & Samples</h1>
              <p className="text-muted-foreground text-sm">Personal gifts and product samples</p>
            </div>
          </div>

          {/* Draft Actions */}
          {hasDraft && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveNow}
                disabled={isSaving}
                className="text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscardDialog(true)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Discard
              </Button>
            </div>
          )}
        </div>

        <BookingProgress steps={STEPS} currentStep={currentStep} />

        {bookingData.prohibitedItemAttempted && currentStep === 4 && (
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Booking Blocked - Prohibited Items</AlertTitle>
            <AlertDescription>
              Your shipment contains items that are prohibited for international shipping.
              Please remove these items and try again, or contact support for assistance.
            </AlertDescription>
          </Alert>
        )}

        {isOverValueCap && currentStep === 1 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Value Limit Exceeded</AlertTitle>
            <AlertDescription>
              Total value (₹{totalValue.toLocaleString('en-IN')}) exceeds CSB IV limit of ₹25,000.
              <Button variant="link" className="p-0 h-auto text-destructive-foreground underline ml-2">
                Contact Support
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
            <Button
              onClick={handleNext}
              disabled={hasBlockingIssue}
              className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConfirmAndPay}
              disabled={isProcessing || hasBlockingIssue}
              className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isProcessing ? (
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
          <Clock className="h-3 w-3" />
          {isSaving ? (
            <span>Saving...</span>
          ) : lastSaved ? (
            <span>Draft saved {formatRelativeTime(lastSaved.toISOString())}</span>
          ) : (
            <span>Your progress is auto-saved as a draft for 30 days</span>
          )}
        </div>
      </div>

      {/* Discard Draft Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Draft?</DialogTitle>
            <DialogDescription>
              Are you sure you want to discard this draft? All your progress will be lost and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default GiftBooking;
