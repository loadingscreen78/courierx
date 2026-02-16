import { format, addMonths } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Clock, IndianRupee, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Medicine {
  id: string;
  medicineType: 'allopathy' | 'homeopathy' | 'ayurvedic' | 'other' | '';
  category: 'branded' | 'generic' | '';
  form: 'tablet' | 'capsule' | 'liquid' | 'semi-liquid' | 'powder' | '';
  medicineName: string;
  unitCount: number;
  unitPrice: number;
  dailyDosage: number;
  manufacturerName: string;
  manufacturerAddress: string;
  mfgDate: Date | null;
  batchNo: string;
  expiryDate: Date | null;
  hsnCode: string;
  isControlled: boolean;
}

/** Helper to get the default expiry date (6 months from today at midnight) */
export const getDefaultExpiryDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return addMonths(today, 6);
};

export const createEmptyMedicine = (): Medicine => ({
  id: crypto.randomUUID(),
  medicineType: '',
  category: '',
  form: '',
  medicineName: '',
  unitCount: 0,
  unitPrice: 0,
  dailyDosage: 1,
  manufacturerName: '',
  manufacturerAddress: '',
  mfgDate: null,
  batchNo: '',
  expiryDate: getDefaultExpiryDate(),
  hsnCode: '',
  isControlled: false,
});

interface MedicineCardProps {
  medicine: Medicine;
  index: number;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const MedicineCard = ({ medicine, index, onEdit, onRemove, canRemove }: MedicineCardProps) => {
  const supplyDays = medicine.dailyDosage > 0
    ? Math.ceil(medicine.unitCount / medicine.dailyDosage)
    : 0;
  const totalValue = medicine.unitCount * medicine.unitPrice;
  const isOver90Days = supplyDays > 90;
  const isOverValueCap = totalValue > 25000;

  // Check expiry warning (6-12 months)
  const today = new Date();
  const sixMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
  const twelveMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 12, today.getDate());
  const hasExpiryWarning = medicine.expiryDate &&
    medicine.expiryDate >= sixMonthsFromNow &&
    medicine.expiryDate <= twelveMonthsFromNow;

  return (
    <Card className={cn(
      "relative transition-all",
      (isOver90Days || isOverValueCap) && "border-destructive bg-destructive/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
              <h4 className="font-semibold text-foreground">
                {medicine.medicineName || 'Untitled Medicine'}
              </h4>
              {medicine.isControlled && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning text-xs">
                  Controlled
                </Badge>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Type</p>
                <p className="capitalize">{medicine.medicineType || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Form</p>
                <p className="capitalize">{medicine.form || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Quantity</p>
                <p>{medicine.unitCount} units</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">HSN Code</p>
                <p className="font-typewriter">{medicine.hsnCode || '-'}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                isOver90Days ? "bg-destructive/10 text-destructive" : "bg-accent/30"
              )}>
                <Clock className="h-3.5 w-3.5" />
                <span className="font-typewriter font-medium">{supplyDays} days</span>
                {isOver90Days && <span className="text-xs">(Max 90)</span>}
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
                isOverValueCap ? "bg-destructive/10 text-destructive" : "bg-accent/30"
              )}>
                <IndianRupee className="h-3.5 w-3.5" />
                <span className="font-typewriter font-medium">₹{totalValue.toLocaleString('en-IN')}</span>
                {isOverValueCap && <span className="text-xs">(Max ₹25,000)</span>}
              </div>
              {hasExpiryWarning && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-warning/10 text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Expires in &lt;12 months</span>
                </div>
              )}
            </div>

            {/* Dates */}
            {(medicine.mfgDate || medicine.expiryDate) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {medicine.mfgDate && (
                  <span>MFG: {format(medicine.mfgDate, 'dd MMM yyyy')}</span>
                )}
                {medicine.expiryDate && (
                  <span>EXP: {format(medicine.expiryDate, 'dd MMM yyyy')}</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(medicine.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {canRemove && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(medicine.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
