import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Upload, FileCheck, AlertCircle, Image } from "lucide-react";
import { CXBCApplicationData } from "@/views/cxbc/CXBCApply";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KYCDocumentsStepProps {
  data: CXBCApplicationData;
  onUpdate: (data: Partial<CXBCApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const KYCDocumentsStep = ({ data, onUpdate, onNext, onBack }: KYCDocumentsStepProps) => {
  const [aadhaarFile, setAadhaarFile] = useState<string>(data.kycAadhaarUrl || "");
  const [panFile, setPanFile] = useState<string>(data.kycPanUrl || "");
  const [shopPhoto, setShopPhoto] = useState<string>(data.shopPhotoUrl || "");
  const [errors, setErrors] = useState<{ aadhaar?: string; pan?: string }>({});

  // For now, we'll use placeholder URLs since storage is not set up
  // In production, these would be actual file uploads to Supabase Storage
  const handleFileChange = (type: 'aadhaar' | 'pan' | 'shop') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a temporary object URL for preview
      const url = URL.createObjectURL(file);
      
      // In production, you would upload to Supabase Storage here
      // For now, we'll store the filename as a placeholder
      const placeholderUrl = `pending-upload:${file.name}`;
      
      if (type === 'aadhaar') {
        setAadhaarFile(placeholderUrl);
        onUpdate({ kycAadhaarUrl: placeholderUrl });
      } else if (type === 'pan') {
        setPanFile(placeholderUrl);
        onUpdate({ kycPanUrl: placeholderUrl });
      } else {
        setShopPhoto(placeholderUrl);
        onUpdate({ shopPhotoUrl: placeholderUrl });
      }
    }
  };

  const handleNext = () => {
    const newErrors: { aadhaar?: string; pan?: string } = {};
    
    if (!aadhaarFile) {
      newErrors.aadhaar = "Aadhaar document is required";
    }
    if (!panFile) {
      newErrors.pan = "PAN card is required";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const getFileName = (url: string) => {
    if (url.startsWith('pending-upload:')) {
      return url.replace('pending-upload:', '');
    }
    return url.split('/').pop() || 'Document uploaded';
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please upload clear, readable copies of your documents. Accepted formats: JPG, PNG, PDF (max 5MB each).
        </AlertDescription>
      </Alert>

      {/* Aadhaar Upload */}
      <div className="space-y-2">
        <Label htmlFor="aadhaar" className="flex items-center gap-2">
          Aadhaar Card *
          {aadhaarFile && <FileCheck className="h-4 w-4 text-green-500" />}
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              id="aadhaar"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange('aadhaar')}
              className="cursor-pointer"
            />
          </div>
        </div>
        {aadhaarFile && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-green-500" />
            {getFileName(aadhaarFile)}
          </p>
        )}
        {errors.aadhaar && (
          <p className="text-sm text-destructive">{errors.aadhaar}</p>
        )}
      </div>

      {/* PAN Upload */}
      <div className="space-y-2">
        <Label htmlFor="pan" className="flex items-center gap-2">
          PAN Card *
          {panFile && <FileCheck className="h-4 w-4 text-green-500" />}
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              id="pan"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange('pan')}
              className="cursor-pointer"
            />
          </div>
        </div>
        {panFile && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-green-500" />
            {getFileName(panFile)}
          </p>
        )}
        {errors.pan && (
          <p className="text-sm text-destructive">{errors.pan}</p>
        )}
      </div>

      {/* Shop Photo Upload */}
      <div className="space-y-2">
        <Label htmlFor="shop" className="flex items-center gap-2">
          Shop Photo (Optional)
          {shopPhoto && <FileCheck className="h-4 w-4 text-green-500" />}
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              id="shop"
              type="file"
              accept="image/*"
              onChange={handleFileChange('shop')}
              className="cursor-pointer"
            />
          </div>
        </div>
        {shopPhoto && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-green-500" />
            {getFileName(shopPhoto)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Upload a clear photo of your shop front. This helps us verify your business location.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1">
          Review Application
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

