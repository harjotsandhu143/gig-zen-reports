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
        className="rounded-2xl border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-all group"
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <div className="p-2.5 rounded-full bg-success/10 group-hover:bg-success/15 transition-colors">
            <Plus className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Add Income</p>
            <p className="text-xs text-muted-foreground">Track earnings from any source</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Add Income</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-full h-8 px-3 text-xs"
          >
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="h-11 rounded-xl border-border/60 bg-secondary/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source" className="text-xs text-muted-foreground">Income Source</Label>
            <Select
              value={formData.sourceName}
              onValueChange={(value) => handleInputChange("sourceName", value)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/60 bg-secondary/30">
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
            <div className="space-y-1.5">
              <Label htmlFor="customSource" className="text-xs text-muted-foreground">Custom Source</Label>
              <Input
                id="customSource"
                type="text"
                placeholder="e.g., Tutoring, Etsy sales"
                value={formData.customSource}
                onChange={(e) => handleInputChange("customSource", e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-secondary/30"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="incomeType" className="text-xs text-muted-foreground">Income Type</Label>
            <Select
              value={formData.incomeType}
              onValueChange={(value) => handleInputChange("incomeType", value)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/60 bg-secondary/30">
                <SelectValue placeholder="Select income type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {INCOME_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Helps estimate tax to set aside
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              className="h-11 rounded-xl border-border/60 bg-secondary/30 text-lg font-medium"
              required
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-full font-medium bg-success hover:bg-success/90 text-success-foreground">
            Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
