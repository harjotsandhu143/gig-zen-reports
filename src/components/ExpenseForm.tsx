import { useState, useEffect } from "react";
import { Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: ''
  });

  // Load form data from localStorage on mount
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

  // Save form data to localStorage whenever it changes
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
    // Clear localStorage after successful submission
    localStorage.removeItem('expenseFormData');
    setFormData({
      date: new Date().toISOString().split('T')[0],
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
      <Card className="stats-card cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-warning-light">
              <Minus className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Add Expense</p>
              <p className="text-sm text-muted-foreground">Track business expenses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stats-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Add Expense</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div>
            <Label htmlFor="expense-name">Expense Name</Label>
            <Input
              id="expense-name"
              type="text"
              placeholder="e.g., Gas, Car maintenance, Phone bill"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div>
            <Label htmlFor="expense-amount">Amount</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <Button type="submit" className="btn-gig w-full">
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}