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
  
  // Determine the display amount (total of all sources)
  const totalAmount = income.doordash + income.ubereats + income.didi + income.coles + income.tips;
  
  // Determine the source name for display
  const getSourceName = () => {
    if (income.sourceName) return income.sourceName;
    if (income.doordash > 0) return 'DoorDash';
    if (income.ubereats > 0) return 'Uber Eats';
    if (income.didi > 0) return 'DiDi';
    if (income.coles > 0) return 'Coles';
    return 'Other';
  };

  const [formData, setFormData] = useState({
    date: income.date,
    amount: totalAmount.toString(),
    sourceName: getSourceName(),
    incomeType: income.incomeType || 'gig',
    // Keep legacy fields for backward compatibility
    doordash: income.doordash,
    ubereats: income.ubereats,
    didi: income.didi,
    coles: income.coles,
    colesHours: income.colesHours,
    tips: income.tips,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount) || 0;
    
    // Map source name to legacy columns for backward compatibility
    const legacyMapping: Record<string, string> = {
      'Uber Eats': 'ubereats',
      'DoorDash': 'doordash',
      'DiDi': 'didi',
      'Coles': 'coles',
    };
    
    const legacyColumn = legacyMapping[formData.sourceName];
    
    const updatedIncome: Omit<Income, 'id'> = {
      date: formData.date,
      doordash: legacyColumn === 'doordash' ? amount : 0,
      ubereats: legacyColumn === 'ubereats' ? amount : 0,
      didi: legacyColumn === 'didi' ? amount : 0,
      coles: legacyColumn === 'coles' ? amount : 0,
      colesHours: formData.sourceName === 'Coles' ? formData.colesHours : null,
      tips: !legacyColumn ? amount : 0, // Use tips for non-legacy sources
      sourceName: formData.sourceName,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          <div>
            <Label htmlFor="sourceName">Source</Label>
            <Input
              id="sourceName"
              type="text"
              value={formData.sourceName}
              onChange={(e) => handleInputChange('sourceName', e.target.value)}
              placeholder="e.g., Uber Eats, Coles, Freelance"
              required
            />
          </div>

          <div>
            <Label htmlFor="incomeType">Income Type</Label>
            <Select
              value={formData.incomeType}
              onValueChange={(value) => handleInputChange('incomeType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select income type" />
              </SelectTrigger>
              <SelectContent>
                {INCOME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="text-lg"
              required
            />
          </div>

          {formData.sourceName === 'Coles' && (
            <div>
              <Label htmlFor="colesHours">Hours Worked</Label>
              <Input
                id="colesHours"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.colesHours?.toString() || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  colesHours: e.target.value ? parseFloat(e.target.value) : null
                }))}
              />
            </div>
          )}
          
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
