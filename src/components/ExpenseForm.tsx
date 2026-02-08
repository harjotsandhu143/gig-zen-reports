import { useState, useEffect } from "react";
import { Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAustraliaDateString } from "@/utils/timezone";

interface Expense {
  date: string;
  name: string;
  amount: number;
}

interface ExpenseFormProps {
  onExpenseAdd: (expense: Expense) => void;
}

export function ExpenseForm({ onExpenseAdd }: ExpenseFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: getAustraliaDateString(),
    name: '',
    amount: ''
  });

  useEffect(() => {
    const savedData = localStorage.getItem('expenseFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('expenseFormData', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount) {
      return;
    }
    
    const expense: Expense = {
      date: formData.date,
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
    };
    
    onExpenseAdd(expense);
    localStorage.removeItem('expenseFormData');
    setFormData({
      date: getAustraliaDateString(),
      name: '',
      amount: ''
    });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <Card
        className="rounded-2xl border-0 shadow-[var(--shadow)] cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <div className="p-2 rounded-full bg-secondary">
            <Minus className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Add Expense</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-[var(--shadow-md)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Add Expense</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-full h-7 px-3 text-xs"
          >
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="expense-date" className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="h-10 rounded-xl border-0 bg-secondary text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="expense-name" className="text-[11px] uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input
              id="expense-name"
              type="text"
              placeholder="e.g., Gas, maintenance"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="h-10 rounded-xl border-0 bg-secondary text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="expense-amount" className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount ($)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="h-10 rounded-xl border-0 bg-secondary text-lg font-semibold"
              required
            />
          </div>

          <Button type="submit" className="w-full h-10 rounded-full text-sm font-medium">
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
