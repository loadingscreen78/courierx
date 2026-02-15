import { DocumentBookingData } from '@/views/DocumentBooking';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileText, Package, Ruler, Scale } from 'lucide-react';

interface DocumentDetailsStepProps {
  data: DocumentBookingData;
  onUpdate: (updates: Partial<DocumentBookingData>) => void;
}

const PACKET_TYPES = [
  { value: 'envelope', label: 'Envelope', description: 'Flat documents', icon: FileText, maxWeight: 100 },
  { value: 'small-packet', label: 'Small Packet', description: 'Up to 500g', icon: Package, maxWeight: 500 },
  { value: 'large-packet', label: 'Large Packet', description: 'Up to 2kg', icon: Package, maxWeight: 2000 },
  { value: 'tube', label: 'Tube', description: 'Rolled documents', icon: Package, maxWeight: 1000 },
];

const DOCUMENT_TYPES = [
  'Legal Documents',
  'Educational Certificates',
  'Government Documents',
  'Medical Records',
  'Business Contracts',
  'Property Documents',
  'Tax Documents',
  'Other',
];

export const DocumentDetailsStep = ({ data, onUpdate }: DocumentDetailsStepProps) => {
  return (
    <div className="space-y-8">
      {/* Packet Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Packet Type *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PACKET_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => onUpdate({ packetType: type.value as DocumentBookingData['packetType'] })}
                className={cn(
                  "p-4 rounded-lg border-2 text-center transition-all btn-press",
                  data.packetType === type.value
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Document Type *</Label>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_TYPES.map((docType) => (
            <button
              key={docType}
              onClick={() => onUpdate({ documentType: docType })}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-all btn-press",
                data.documentType === docType
                  ? "border-destructive bg-destructive/5 text-foreground"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              {docType}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Brief description of documents being shipped..."
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="input-premium resize-none"
          rows={3}
        />
      </div>

      {/* Weight */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Weight *
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min="1"
            max="2000"
            placeholder="Enter weight"
            value={data.weight || ''}
            onChange={(e) => onUpdate({ weight: parseInt(e.target.value) || 0 })}
            className="input-premium max-w-[200px]"
          />
          <span className="text-muted-foreground">grams</span>
        </div>
        {data.weight > 0 && (
          <p className="text-sm text-muted-foreground">
            {data.weight < 100 ? 'Light packet' : data.weight < 500 ? 'Medium packet' : 'Heavy packet'}
          </p>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Dimensions (Optional)
        </Label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="length" className="text-sm">Length (cm)</Label>
            <Input
              id="length"
              type="number"
              min="1"
              placeholder="L"
              value={data.length || ''}
              onChange={(e) => onUpdate({ length: parseInt(e.target.value) || 0 })}
              className="input-premium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width" className="text-sm">Width (cm)</Label>
            <Input
              id="width"
              type="number"
              min="1"
              placeholder="W"
              value={data.width || ''}
              onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
              className="input-premium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              min="1"
              placeholder="H"
              value={data.height || ''}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
              className="input-premium"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Providing accurate dimensions helps us calculate the best shipping rate
        </p>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-accent/30 rounded-lg border border-accent">
        <p className="text-sm text-foreground font-medium mb-2">Document Shipping Guidelines</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Documents must be properly sealed in tamper-proof packaging</li>
          <li>• Maximum weight: 2kg per shipment</li>
          <li>• Original documents should be backed up before shipping</li>
          <li>• No currency, cards, or valuables allowed</li>
        </ul>
      </div>
    </div>
  );
};

