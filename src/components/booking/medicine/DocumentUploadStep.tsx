import { useRef, memo, useCallback } from 'react';
import { MedicineBookingData } from '@/views/MedicineBooking';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadStepProps {
  prescription: File | null;
  pharmacyBill: File | null;
  consigneeId: File | null;
  onUpdate: (updates: Partial<MedicineBookingData>) => void;
}

interface DocumentUploadCardProps {
  title: string;
  description: string;
  file: File | null;
  required: boolean;
  accepts: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

const DocumentUploadCard = memo(({ 
  title, 
  description, 
  file, 
  required,
  accepts,
  onUpload, 
  onRemove 
}: DocumentUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      onUpload(selectedFile);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer btn-press",
        file 
          ? "border-accent bg-accent/10" 
          : "border-dashed border-2 hover:border-muted-foreground"
      )}
      onClick={handleClick}
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accepts}
        onChange={handleFileChange}
        className="hidden"
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              file ? "bg-accent" : "bg-muted"
            )}>
              {file ? (
                <Check className="h-5 w-5 text-accent-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {required && <span className="text-destructive text-sm">*</span>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
          {file && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      {file && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
        </CardContent>
      )}
      {!file && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-6 border-t border-dashed border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG (max 10MB)
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

const DocumentUploadStepComponent = ({ prescription, pharmacyBill, consigneeId, onUpdate }: DocumentUploadStepProps) => {
  // Memoize callbacks to prevent DocumentUploadCard re-renders
  const handlePrescriptionUpload = useCallback((file: File) => {
    onUpdate({ prescription: file });
  }, [onUpdate]);

  const handlePrescriptionRemove = useCallback(() => {
    onUpdate({ prescription: null });
  }, [onUpdate]);

  const handlePharmacyBillUpload = useCallback((file: File) => {
    onUpdate({ pharmacyBill: file });
  }, [onUpdate]);

  const handlePharmacyBillRemove = useCallback(() => {
    onUpdate({ pharmacyBill: null });
  }, [onUpdate]);

  const handleConsigneeIdUpload = useCallback((file: File) => {
    onUpdate({ consigneeId: file });
  }, [onUpdate]);

  const handleConsigneeIdRemove = useCallback(() => {
    onUpdate({ consigneeId: null });
  }, [onUpdate]);

  return (
    <div className="space-y-6" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
      <div className="space-y-2">
        <h3 className="font-typewriter text-lg font-bold">Required Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload clear, legible copies of the following documents. All documents must be valid and match the shipment details.
        </p>
      </div>

      <div className="grid gap-4" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
        <DocumentUploadCard
          title="Doctor's Prescription"
          description="Original prescription with doctor's name, registration number, and date"
          file={prescription}
          required={true}
          accepts=".pdf,.jpg,.jpeg,.png"
          onUpload={handlePrescriptionUpload}
          onRemove={handlePrescriptionRemove}
        />

        <DocumentUploadCard
          title="Pharmacy Bill / Invoice"
          description="Purchase bill showing medicine name, quantity, and price"
          file={pharmacyBill}
          required={true}
          accepts=".pdf,.jpg,.jpeg,.png"
          onUpload={handlePharmacyBillUpload}
          onRemove={handlePharmacyBillRemove}
        />

        <DocumentUploadCard
          title="Consignee ID Document"
          description="Passport or International Driving License of the recipient"
          file={consigneeId}
          required={true}
          accepts=".pdf,.jpg,.jpeg,.png"
          onUpload={handleConsigneeIdUpload}
          onRemove={handleConsigneeIdRemove}
        />
      </div>

      {/* Document Guidelines */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Document Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              Prescription must be dated within the last 6 months
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              Medicine name and dosage on prescription must match shipment details
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              Pharmacy bill must be from a licensed pharmacy with GST number
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              Consignee ID must be valid and not expired
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground">•</span>
              All documents should be clearly readable without blur or glare
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Upload Status Summary */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
        <span className="text-sm font-medium">Documents Uploaded</span>
        <span className="font-typewriter font-bold text-foreground">
          {[prescription, pharmacyBill, consigneeId].filter(Boolean).length} / 3
        </span>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders on parent state changes
export const DocumentUploadStep = memo(DocumentUploadStepComponent);
