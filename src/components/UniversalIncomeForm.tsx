import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAustraliaDateString } from "@/utils/timezone";
import { INCOME_TYPES } from "@/utils/atoTaxCalculator";

const COMMON_SOURCES = [
  "Uber Eats",
  "DoorDash",
  "DiDi",
  "Coles",
  "Woolworths",
  "Salary",
  "Freelance",
  "Other",
];

interface UniversalIncomeFormProps {
  onIncomeAdd: (income: {
    date: string;
    amount: number;
    sourceName: string;
    incomeType: string;
  }) => void;
}

export function UniversalIncomeForm({ onIncomeAdd }: UniversalIncomeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: getAustraliaDateString(),
    amount: "",
    sourceName: "",
    customSource: "",
    incomeType: "gig",
  });

  useEffect(() => {
    const savedData = localStorage.getItem("universalIncomeFormData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("universalIncomeFormData", JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sourceName =
      formData.sourceName === "Other"
        ? formData.customSource.trim()
        : formData.sourceName;

    if (!sourceName || !formData.amount) {
      return;
    }

    onIncomeAdd({
      date: formData.date,
      amount: parseFloat(formData.amount) || 0,
      sourceName,
      incomeType: formData.incomeType,
    });

    localStorage.removeItem("universalIncomeFormData");
    setFormData({
      date: getAustraliaDateString(),
      amount: "",
      sourceName: "",
      customSource: "",
      incomeType: "gig",
    });
    setIsOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <Card
        className="rounded-2xl border-0 shadow-[var(--shadow)] cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <div className="p-2 rounded-full bg-success/10">
            <Plus className="h-4 w-4 text-success" />
          </div>
          <span className="text-sm font-medium text-foreground">Add Income</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-0 shadow-[var(--shadow-md)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Add Income</span>
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
            <Label htmlFor="date" className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="h-10 rounded-xl border-0 bg-secondary text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="source" className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</Label>
            <Select
              value={formData.sourceName}
              onValueChange={(value) => handleInputChange("sourceName", value)}
            >
              <SelectTrigger className="h-10 rounded-xl border-0 bg-secondary text-sm">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {COMMON_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.sourceName === "Other" && (
            <div className="space-y-1">
              <Label htmlFor="customSource" className="text-[11px] uppercase tracking-wider text-muted-foreground">Custom Source</Label>
              <Input
                id="customSource"
                type="text"
                placeholder="e.g., Tutoring"
                value={formData.customSource}
                onChange={(e) => handleInputChange("customSource", e.target.value)}
                className="h-10 rounded-xl border-0 bg-secondary text-sm"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="incomeType" className="text-[11px] uppercase tracking-wider text-muted-foreground">Type</Label>
            <Select
              value={formData.incomeType}
              onValueChange={(value) => handleInputChange("incomeType", value)}
            >
              <SelectTrigger className="h-10 rounded-xl border-0 bg-secondary text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {INCOME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount" className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              className="h-10 rounded-xl border-0 bg-secondary text-lg font-semibold"
              required
            />
          </div>

          <Button type="submit" className="w-full h-10 rounded-full text-sm font-medium">
            Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
