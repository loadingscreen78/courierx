"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Store, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoMain from "@/assets/logo-main.jpeg";
import { BusinessInfoStep } from "@/components/cxbc/apply/BusinessInfoStep";
import { KYCDocumentsStep } from "@/components/cxbc/apply/KYCDocumentsStep";
import { ReviewStep } from "@/components/cxbc/apply/ReviewStep";

export interface CXBCApplicationData {
  businessName: string;
  ownerName: string;
  gstNumber: string;
  panNumber: string;
  zone: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  kycAadhaarUrl: string;
  kycPanUrl: string;
  shopPhotoUrl: string;
}

const steps = [
  { id: 1, title: "Business Info", description: "Tell us about your business" },
  { id: 2, title: "KYC Documents", description: "Upload required documents" },
  { id: 3, title: "Review & Submit", description: "Review your application" },
];

const CXBCApply = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<CXBCApplicationData>({
    businessName: "",
    ownerName: "",
    gstNumber: "",
    panNumber: "",
    zone: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    kycAadhaarUrl: "",
    kycPanUrl: "",
    shopPhotoUrl: "",
  });

  const updateFormData = (data: Partial<CXBCApplicationData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("cxbc_partner_applications")
        .insert({
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          gst_number: formData.gstNumber || null,
          pan_number: formData.panNumber,
          zone: formData.zone as any,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          kyc_aadhaar_url: formData.kycAadhaarUrl || null,
          kyc_pan_url: formData.kycPanUrl || null,
          shop_photo_url: formData.shopPhotoUrl || null,
          status: "pending",
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-primary/20 shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for applying to become a CourierX Booking Counter partner. 
                We&apos;ll review your application and get back to you within 2-3 business days.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You&apos;ll receive an email at <strong>{formData.email}</strong> once your application is reviewed.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoMain.src} alt="CourierX" className="h-8 w-auto rounded" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>Partner Application</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`text-center flex-1 ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 text-sm font-medium
                  ${currentStep > step.id ? 'bg-primary text-primary-foreground' : 
                    currentStep === step.id ? 'bg-primary/20 border-2 border-primary text-primary' : 
                    'bg-muted text-muted-foreground'}`}
                >
                  {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && (
                  <BusinessInfoStep 
                    data={formData} 
                    onUpdate={updateFormData}
                    onNext={handleNext}
                  />
                )}
                {currentStep === 2 && (
                  <KYCDocumentsStep 
                    data={formData} 
                    onUpdate={updateFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 3 && (
                  <ReviewStep 
                    data={formData}
                    onBack={handleBack}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Already a partner? <a href="/auth" className="text-primary hover:underline">Login here</a></p>
        </div>
      </main>
    </div>
  );
};

export default CXBCApply;


