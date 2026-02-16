import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDraft } from '@/hooks/useDraft';
import { formatRelativeTime } from '@/lib/drafts/draftService';
import { AppLayout } from '@/components/layout';
import { MedicineDetailsStep } from '@/components/booking/medicine/MedicineDetailsStep';
import { AddressStep } from '@/components/booking/medicine/AddressStep';
import { DocumentUploadStep } from '@/components/booking/medicine/DocumentUploadStep';
import { AddonsStep } from '@/components/booking/medicine/AddonsStep';
import { ReviewStep } from '@/components/booking/medicine/ReviewStep';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Medicine, createEmptyMedicine } from '@/components/booking/medicine/MedicineCard';
import { createMedicineShipment } from '@/lib/shipments/medicineShipmentService';
import { toast } from 'sonner';

export interface MedicineBookingData {
  // Multiple Medicines
  medicines: Medicine[];

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
    passportNumber: string;
  };

  // Documents
  prescription: File | null;
  pharmacyBill: File | null;
  consigneeId: File | null;

  // Add-ons
  insurance: boolean;
  specialPackaging: boolean;
}

const initialBookingData: MedicineBookingData = {
  medicines: [],
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
    passportNumber: '',
  },
  prescription: null,
  pharmacyBill: null,
  consigneeId: null,
  insurance: false,
  specialPackaging: false,
};

const STEPS = [
  { id: 1, title: 'Medicine Details', description: 'Enter medicine information' },
  { id: 2, title: 'Addresses', description: 'Pickup & delivery addresses' },
  { id: 3, title: 'Documents', description: 'Upload required documents' },
  { id: 4, title: 'Add-ons', description: 'Insurance & packaging' },
  { id: 5, title: 'Review', description: 'Confirm your booking' },
];

interface MedicineBookingProps {
  isAdminMode?: boolean;
}

const MedicineBooking = ({ isAdminMode = false }: MedicineBookingProps) => {
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
  } = useDraft<MedicineBookingData>({
    type: 'medicine',
    initialData: initialBookingData,
    totalSteps: STEPS.length,
    draftId,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mediumTap, errorFeedback, successFeedback } = useHaptics();
  const { playClick, playError, playSuccess } = useSoundEffects();

  // Calculate aggregated values across all medicines
  const aggregatedSupplyDays = bookingData.medicines.reduce((max, med) => {
    const supply = med.dailyDosage > 0 ? Math.ceil(med.unitCount / med.dailyDosage) : 0;
    return Math.max(max, supply);
  }, 0);

  const aggregatedTotalValue = bookingData.medicines.reduce((sum, med) => {
    return sum + (med.unitCount * med.unitPrice);
  }, 0);

  // Check if any medicine has blocking issues
  const hasBlockingMedicine = bookingData.medicines.some(med => {
    const supply = med.dailyDosage > 0 ? Math.ceil(med.unitCount / med.dailyDosage) : 0;
    const value = med.unitCount * med.unitPrice;
    return supply > 90 || value > 25000;
  });

  const isOverValueCap = aggregatedTotalValue > 25000;
  const hasBlockingIssue = hasBlockingMedicine || isOverValueCap;

  const updateBookingData = useCallback((updates: Partial<MedicineBookingData>) => {
    setData(prev => {
      // Only update if values actually changed
      const hasChanges = Object.keys(updates).some(key => {
        const k = key as keyof MedicineBookingData;
        const oldVal = prev[k];
        const newVal = updates[k];

        // Special handling for File objects
        if (oldVal instanceof File && newVal instanceof File) {
          return oldVal.name !== newVal.name || oldVal.size !== newVal.size;
        }
        if (oldVal instanceof File || newVal instanceof File) {
          return oldVal !== newVal;
        }

        // For other values, use JSON comparison
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
      });

      if (!hasChanges) return prev;

      return { ...prev, ...updates };
    });
    // Only clear errors if there were errors
    setValidationErrors(prev => prev.length > 0 ? [] : prev);
  }, [setData]);

  const updateMedicines = useCallback((medicines: Medicine[]) => {
    setData(prev => ({ ...prev, medicines }));
    // Only clear errors if there were errors
    setValidationErrors(prev => prev.length > 0 ? [] : prev);
  }, [setData]);

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (bookingData.medicines.length === 0) {
          errors.push('Please add at least one medicine');
        } else {
          // Only validate medicine details if medicines exist
          bookingData.medicines.forEach((med, index) => {
            // Check if medicine has required fields filled
            if (!med.medicineName.trim()) {
              errors.push(`Medicine #${index + 1}: Please enter medicine name`);
            }
            if (!med.medicineType) {
              errors.push(`Medicine #${index + 1}: Please select medicine type`);
            }
            if (!med.category) {
              errors.push(`Medicine #${index + 1}: Please select category`);
            }
            if (!med.form) {
              errors.push(`Medicine #${index + 1}: Please select form`);
            }
            if (med.unitCount <= 0) {
              errors.push(`Medicine #${index + 1}: Please enter valid unit count`);
            }
            if (med.unitPrice <= 0) {
              errors.push(`Medicine #${index + 1}: Please enter valid unit price`);
            }

            // Check supply and value limits
            const supply = med.dailyDosage > 0 ? Math.ceil(med.unitCount / med.dailyDosage) : 0;
            const value = med.unitCount * med.unitPrice;
            if (supply > 90) errors.push(`Medicine #${index + 1}: Supply exceeds 90 days`);
            if (value > 25000) errors.push(`Medicine #${index + 1}: Value exceeds ₹25,000`);
          });

          if (isOverValueCap) errors.push('Total value of all medicines exceeds ₹25,000 CSB IV limit');
        }
        break;
      case 2:
        if (!bookingData.pickupAddress.fullName.trim()) errors.push('Please enter pickup contact name');
        if (!bookingData.pickupAddress.phone.trim()) errors.push('Please enter pickup phone number');
        if (!bookingData.pickupAddress.addressLine1.trim()) errors.push('Please enter pickup address');
        if (!bookingData.pickupAddress.pincode.trim() || bookingData.pickupAddress.pincode.length !== 6) errors.push('Please enter valid 6-digit pincode');
        if (!bookingData.consigneeAddress.fullName.trim()) errors.push('Please enter consignee name');
        if (!bookingData.consigneeAddress.country.trim()) errors.push('Please select destination country');
        if (!bookingData.consigneeAddress.addressLine1.trim()) errors.push('Please enter consignee address');
        break;
      case 3:
        if (!bookingData.prescription) errors.push('Please upload doctor\'s prescription');
        if (!bookingData.pharmacyBill) errors.push('Please upload pharmacy bill/invoice');
        if (!bookingData.consigneeId) errors.push('Please upload consignee ID document');
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
      console.log('[MedicineBooking] Submitting booking data...');

      // Create shipment first
      const result = await createMedicineShipment({
        bookingData,
        userId: user.id,
      });

      if (result.success && result.shipmentId) {
        // Deduct funds from wallet
        console.log('[MedicineBooking] Deducting funds from wallet...');

        // Calculate total amount (same as in service)
        const baseAmount = 2000; // Simplified - should match actual calculation
        let totalAmount = baseAmount;
        if (bookingData.insurance) totalAmount += 150;
        if (bookingData.specialPackaging) totalAmount += 300;

        const walletResult = await deductFundsForShipment(
          totalAmount,
          result.shipmentId,
          `Medicine shipment to ${bookingData.consigneeAddress.country}`
        );

        if (!walletResult.success) {
          console.error('[MedicineBooking] Wallet deduction failed:', walletResult.error);
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
      console.error('[MedicineBooking] Error:', error);
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
        return (
          <MedicineDetailsStep
            medicines={bookingData.medicines}
            onUpdateMedicines={updateMedicines}
            aggregatedSupplyDays={aggregatedSupplyDays}
            aggregatedTotalValue={aggregatedTotalValue}
          />
        );
      case 2:
        return (
          <AddressStep
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 3:
        return (
          <DocumentUploadStep
            prescription={bookingData.prescription}
            pharmacyBill={bookingData.pharmacyBill}
            consigneeId={bookingData.consigneeId}
            onUpdate={updateBookingData}
          />
        );
      case 4:
        return (
          <AddonsStep
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={bookingData}
            aggregatedSupplyDays={aggregatedSupplyDays}
            aggregatedTotalValue={aggregatedTotalValue}
            onConfirmBooking={handleConfirmBooking}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="btn-press"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ship Medicine</h1>
            <p className="text-muted-foreground text-sm">Prescription medicines with documentation</p>
          </div>
        </div>

        {/* Progress */}
        <BookingProgress steps={STEPS} currentStep={currentStep} />

        {/* Blocking Alerts */}
        {hasBlockingIssue && currentStep === 1 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking Blocked</AlertTitle>
            <AlertDescription>
              {hasBlockingMedicine && (
                <p>One or more medicines exceed the 90-day supply limit or individual ₹25,000 value cap.</p>
              )}
              {isOverValueCap && !hasBlockingMedicine && (
                <p>Total value (₹{aggregatedTotalValue.toLocaleString('en-IN')}) exceeds CSB IV limit of ₹25,000.</p>
              )}
              <Button variant="link" className="p-0 h-auto text-destructive-foreground underline mt-2">
                Contact Support for Assistance
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
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

        {/* Step Content */}
        <div className="bg-card rounded-xl border border-border p-6">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn-press"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={hasBlockingIssue && currentStep === 1}
              className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
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

export default MedicineBooking;
