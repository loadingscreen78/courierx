import { useState, memo } from 'react';
import { Medicine, MedicineCard, createEmptyMedicine } from './MedicineCard';
import { MedicineForm } from './MedicineForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Info, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicineDetailsStepProps {
  medicines: Medicine[];
  onUpdateMedicines: (medicines: Medicine[]) => void;
  aggregatedSupplyDays: number;
  aggregatedTotalValue: number;
}

const MedicineDetailsStepComponent = ({ 
  medicines,
  onUpdateMedicines,
  aggregatedSupplyDays,
  aggregatedTotalValue
}: MedicineDetailsStepProps) => {
  // Initialize with a new medicine form if no medicines exist
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(() => {
    if (medicines.length === 0) {
      const newMedicine = createEmptyMedicine();
      return newMedicine.id;
    }
    return null;
  });
  const [isAddingNew, setIsAddingNew] = useState(medicines.length === 0);

  const isOverValueCap = aggregatedTotalValue > 25000;

  const handleAddMedicine = () => {
    const newMedicine = createEmptyMedicine();
    setEditingMedicineId(newMedicine.id);
    setIsAddingNew(true);
  };

  const handleSaveMedicine = (medicine: Medicine) => {
    if (isAddingNew) {
      onUpdateMedicines([...medicines, medicine]);
    } else {
      onUpdateMedicines(
        medicines.map(m => m.id === medicine.id ? medicine : m)
      );
    }
    setEditingMedicineId(null);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => {
    setEditingMedicineId(null);
    setIsAddingNew(false);
  };

  const handleEditMedicine = (id: string) => {
    setEditingMedicineId(id);
    setIsAddingNew(false);
  };

  const handleRemoveMedicine = (id: string) => {
    onUpdateMedicines(medicines.filter(m => m.id !== id));
  };

  const editingMedicine = editingMedicineId 
    ? medicines.find(m => m.id === editingMedicineId) || createEmptyMedicine()
    : null;

  // Check if any medicine has blocking issues
  const hasAnyBlockingMedicine = medicines.some(m => {
    const supply = m.dailyDosage > 0 ? Math.ceil(m.unitCount / m.dailyDosage) : 0;
    const value = m.unitCount * m.unitPrice;
    return supply > 90 || value > 25000;
  });

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-typewriter text-lg font-bold">Medicine Details</h3>
          <p className="text-sm text-muted-foreground">
            Add all medicines you want to ship in this booking
          </p>
        </div>
        {!editingMedicineId && medicines.length > 0 && (
          <Button
            onClick={handleAddMedicine}
            variant="outline"
            className="btn-press"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        )}
      </div>

      {/* Aggregated Totals */}
      {medicines.length > 0 && !editingMedicineId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            "bg-accent/30 border-accent"
          )}>
            <Clock className="h-5 w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Max Supply Duration (any medicine)</p>
              <p className="font-typewriter font-bold text-lg">
                {aggregatedSupplyDays} days
                <span className="text-xs font-normal ml-2 text-muted-foreground">(Max 90 per medicine)</span>
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg border",
            isOverValueCap ? "bg-destructive/10 border-destructive" : "bg-accent/30 border-accent"
          )}>
            <IndianRupee className={cn("h-5 w-5", isOverValueCap && "text-destructive")} />
            <div>
              <p className="text-xs text-muted-foreground">Total Declared Value (all medicines)</p>
              <p className={cn(
                "font-typewriter font-bold text-lg",
                isOverValueCap && "text-destructive"
              )}>
                ₹{aggregatedTotalValue.toLocaleString('en-IN')}
                {isOverValueCap && <span className="text-xs font-normal ml-2">(Max ₹25,000)</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Medicine List */}
      {medicines.length > 0 && !editingMedicineId && (
        <div className="space-y-3">
          {medicines.map((medicine, index) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              index={index}
              onEdit={handleEditMedicine}
              onRemove={handleRemoveMedicine}
              canRemove={medicines.length > 1}
            />
          ))}
        </div>
      )}

      {/* Medicine Form (Add/Edit) */}
      {editingMedicineId && editingMedicine && (
        <MedicineForm
          medicine={isAddingNew ? createEmptyMedicine() : editingMedicine}
          onSave={handleSaveMedicine}
          onCancel={handleCancelEdit}
          isEditing={!isAddingNew}
        />
      )}

      {/* Empty State - Show form for first medicine */}
      {medicines.length === 0 && !editingMedicineId && (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">No medicines added yet</p>
          <Button
            onClick={handleAddMedicine}
            className="btn-press bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Medicine
          </Button>
        </div>
      )}

      {/* Blocking Warning */}
      {hasAnyBlockingMedicine && !editingMedicineId && (
        <Alert variant="destructive">
          <AlertDescription>
            One or more medicines exceed the 90-day supply limit or ₹25,000 value cap. 
            Please edit or remove the affected medicines to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Note */}
      {!editingMedicineId && (
        <Alert className="bg-accent/20 border-accent">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Ensure all medicine details match your prescription and pharmacy bill. 
            Mismatched information may delay or block your shipment.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders on parent state changes
export const MedicineDetailsStep = memo(MedicineDetailsStepComponent);
