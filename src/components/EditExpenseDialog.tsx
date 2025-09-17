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

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
}

interface EditExpenseDialogProps {
  expense: Expense;
  onUpdate: (id: string, expense: Omit<Expense, 'id'>) => void;
}

export function EditExpenseDialog({ expense, onUpdate }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: expense.date,
    name: expense.name,
    amount: expense.amount.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedExpense = {
      date: formData.date,
      name: formData.name,
      amount: parseFloat(formData.amount) || 0
    };
    
    onUpdate(expense.id, updatedExpense);
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
          <DialogTitle>Edit Expense Record</DialogTitle>
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
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              type="text"
              placeholder="Expense description"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
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
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Expense</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}