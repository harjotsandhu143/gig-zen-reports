import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Income {
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
}

interface IncomeFormProps {
  onIncomeAdd: (income: Income) => void;
}

export function IncomeForm({ onIncomeAdd }: IncomeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    doordash: '',
    ubereats: '',
    didi: '',
    coles: ''
  });

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('incomeFormData');
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
    localStorage.setItem('incomeFormData', JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const income: Income = {
      date: formData.date,
      doordash: parseFloat(formData.doordash) || 0,
      ubereats: parseFloat(formData.ubereats) || 0,
      didi: parseFloat(formData.didi) || 0,
      coles: parseFloat(formData.coles) || 0,
    };
    
    onIncomeAdd(income);
    // Clear localStorage after successful submission
    localStorage.removeItem('incomeFormData');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      doordash: '',
      ubereats: '',
      didi: '',
      coles: ''
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
            <div className="p-3 rounded-full bg-success-light">
              <Plus className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Add Today's Income</p>
              <p className="text-sm text-muted-foreground">Track earnings from all gig platforms</p>
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
          <span>Add Income</span>
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doordash">DoorDash</Label>
              <Input
                id="doordash"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.doordash}
                onChange={(e) => handleInputChange('doordash', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <Label htmlFor="ubereats">Uber Eats</Label>
              <Input
                id="ubereats"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ubereats}
                onChange={(e) => handleInputChange('ubereats', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <Label htmlFor="didi">DiDi</Label>
              <Input
                id="didi"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.didi}
                onChange={(e) => handleInputChange('didi', e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <Label htmlFor="coles">Coles</Label>
              <Input
                id="coles"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.coles}
                onChange={(e) => handleInputChange('coles', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <Button type="submit" className="btn-income w-full">
            Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}