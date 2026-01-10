import { useState } from "react";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INCOME_TYPES } from "@/utils/atoTaxCalculator";

interface Income {
  id: string;
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
  colesHours: number | null;
  tips: number;
  sourceName: string | null;
  incomeType: string;
}

interface EditIncomeDialogProps {
  income: Income;
  onUpdate: (id: string, income: Omit<Income, 'id'>) => void;
}

export function EditIncomeDialog({ income, onUpdate }: EditIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: income.date,
    doordash: income.doordash.toString(),
    ubereats: income.ubereats.toString(),
    didi: income.didi.toString(),
    coles: income.coles.toString(),
    colesHours: income.colesHours?.toString() || '',
    tips: income.tips.toString(),
    sourceName: income.sourceName || '',
    incomeType: income.incomeType || 'gig',
  });

  // Reset form when dialog opens with fresh income data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormData({
        date: income.date,
        doordash: income.doordash.toString(),
        ubereats: income.ubereats.toString(),
        didi: income.didi.toString(),
        coles: income.coles.toString(),
        colesHours: income.colesHours?.toString() || '',
        tips: income.tips.toString(),
        sourceName: income.sourceName || '',
        incomeType: income.incomeType || 'gig',
      });
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedIncome: Omit<Income, 'id'> = {
      date: formData.date,
      doordash: parseFloat(formData.doordash) || 0,
      ubereats: parseFloat(formData.ubereats) || 0,
      didi: parseFloat(formData.didi) || 0,
      coles: parseFloat(formData.coles) || 0,
      colesHours: formData.colesHours ? parseFloat(formData.colesHours) : null,
      tips: parseFloat(formData.tips) || 0,
      sourceName: formData.sourceName || null,
      incomeType: formData.incomeType,
    };
    
    onUpdate(income.id, updatedIncome);
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate total for display
  const total = (parseFloat(formData.doordash) || 0) + 
                (parseFloat(formData.ubereats) || 0) + 
                (parseFloat(formData.didi) || 0) + 
                (parseFloat(formData.coles) || 0) + 
                (parseFloat(formData.tips) || 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="doordash">DoorDash</Label>
              <Input
                id="doordash"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.doordash}
                onChange={(e) => handleInputChange('doordash', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="ubereats">Uber Eats</Label>
              <Input
                id="ubereats"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.ubereats}
                onChange={(e) => handleInputChange('ubereats', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="didi">DiDi</Label>
              <Input
                id="didi"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.didi}
                onChange={(e) => handleInputChange('didi', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="coles">Coles</Label>
              <Input
                id="coles"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.coles}
                onChange={(e) => handleInputChange('coles', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="colesHours">Coles Hours</Label>
              <Input
                id="colesHours"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.colesHours}
                onChange={(e) => handleInputChange('colesHours', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tips">Tips/Other</Label>
              <Input
                id="tips"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.tips}
                onChange={(e) => handleInputChange('tips', e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-success text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Income</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
