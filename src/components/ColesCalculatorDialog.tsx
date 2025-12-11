import { useState } from "react";
import { Calculator, Clock, Calendar, User, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, getDay } from "date-fns";
import { getAustraliaDateString } from "@/utils/timezone";
import { calculateWeeklyTax } from "@/utils/taxCalculator";

interface ColesCalculatorDialogProps {
  onCalculate: (grossPay: number) => void;
  currentDate: string;
}

// Wage rates based on Coles Retail Enterprise Agreement 2024 (July 2025 rates)
const WAGE_RATES = {
  "20+": { base: 27.14, evening: 33.92, saturday: 33.92, sunday: 40.70, publicHoliday: 61.05 },
  "19": { base: 21.84, evening: 27.30, saturday: 27.30, sunday: 32.77, publicHoliday: 49.15 },
  "18": { base: 19.27, evening: 24.08, saturday: 24.08, sunday: 28.90, publicHoliday: 43.35 },
};

interface PayBreakdown {
  hours: number;
  rate: number;
  rateName: string;
  subtotal: number;
}

export function ColesCalculatorDialog({ onCalculate, currentDate }: ColesCalculatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [shiftDate, setShiftDate] = useState(currentDate || getAustraliaDateString());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [age, setAge] = useState<"20+" | "19" | "18">("20+");
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [breakdown, setBreakdown] = useState<PayBreakdown[]>([]);
  const [totalGross, setTotalGross] = useState(0);
  const [estimatedTax, setEstimatedTax] = useState(0);
  const [estimatedNet, setEstimatedNet] = useState(0);
  const [calculated, setCalculated] = useState(false);
  const [breakDuration, setBreakDuration] = useState(0);
  const [totalShiftHours, setTotalShiftHours] = useState(0);

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
  };

  const getDayType = (dateStr: string): "weekday" | "saturday" | "sunday" => {
    const date = parseISO(dateStr);
    const day = getDay(date);
    if (day === 0) return "sunday";
    if (day === 6) return "saturday";
    return "weekday";
  };

  const getBreakDuration = (shiftHours: number): number => {
    // Break rules: 6+ hours = 30 min break, 9+ hours = 1 hour break
    if (shiftHours >= 9) return 1;
    if (shiftHours >= 6) return 0.5;
    return 0;
  };

  const calculatePay = () => {
    const rates = WAGE_RATES[age];
    const startHour = parseTime(startTime);
    const endHour = parseTime(endTime);
    const dayType = getDayType(shiftDate);
    
    const payBreakdown: PayBreakdown[] = [];
    
    if (endHour <= startHour) {
      // Invalid time range
      return;
    }

    const shiftHours = endHour - startHour;
    const breakHours = getBreakDuration(shiftHours);
    const paidHours = shiftHours - breakHours;
    
    setTotalShiftHours(shiftHours);
    setBreakDuration(breakHours);

    if (isPublicHoliday) {
      // All hours at public holiday rate
      payBreakdown.push({
        hours: paidHours,
        rate: rates.publicHoliday,
        rateName: "Public Holiday",
        subtotal: paidHours * rates.publicHoliday,
      });
    } else if (dayType === "sunday") {
      // All hours at Sunday rate (9am-11pm)
      payBreakdown.push({
        hours: paidHours,
        rate: rates.sunday,
        rateName: "Sunday",
        subtotal: paidHours * rates.sunday,
      });
    } else if (dayType === "saturday") {
      // All hours at Saturday rate (7am-11pm)
      payBreakdown.push({
        hours: paidHours,
        rate: rates.saturday,
        rateName: "Saturday",
        subtotal: paidHours * rates.saturday,
      });
    } else {
      // Weekday - split by base (7am-6pm) and evening (6pm-11pm)
      const eveningStart = 18; // 6pm
      
      // Calculate how the break affects the time split
      // Break is taken in the middle of the shift
      const breakStart = startHour + (shiftHours / 2) - (breakHours / 2);
      const breakEnd = breakStart + breakHours;
      
      if (endHour <= eveningStart) {
        // All hours are base rate
        payBreakdown.push({
          hours: paidHours,
          rate: rates.base,
          rateName: "Base Rate (Mon-Fri 7am-6pm)",
          subtotal: paidHours * rates.base,
        });
      } else if (startHour >= eveningStart) {
        // All hours are evening rate
        payBreakdown.push({
          hours: paidHours,
          rate: rates.evening,
          rateName: "Evening (Mon-Fri 6pm-11pm)",
          subtotal: paidHours * rates.evening,
        });
      } else {
        // Split between base and evening, accounting for break in the middle
        let baseHours = Math.min(eveningStart, endHour) - startHour;
        let eveningHours = endHour - Math.max(eveningStart, startHour);
        
        if (eveningStart > startHour && eveningStart < endHour) {
          baseHours = eveningStart - startHour;
          eveningHours = endHour - eveningStart;
        }
        
        // Deduct break proportionally from the period it falls in
        if (breakHours > 0) {
          if (breakEnd <= eveningStart) {
            // Break is entirely in base time
            baseHours -= breakHours;
          } else if (breakStart >= eveningStart) {
            // Break is entirely in evening time
            eveningHours -= breakHours;
          } else {
            // Break spans across base and evening
            const breakInBase = eveningStart - breakStart;
            const breakInEvening = breakEnd - eveningStart;
            baseHours -= breakInBase;
            eveningHours -= breakInEvening;
          }
        }
        
        if (baseHours > 0) {
          payBreakdown.push({
            hours: baseHours,
            rate: rates.base,
            rateName: "Base Rate (Mon-Fri 7am-6pm)",
            subtotal: baseHours * rates.base,
          });
        }
        
        if (eveningHours > 0) {
          payBreakdown.push({
            hours: eveningHours,
            rate: rates.evening,
            rateName: "Evening (Mon-Fri 6pm-11pm)",
            subtotal: eveningHours * rates.evening,
          });
        }
      }
    }

    const gross = payBreakdown.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Use ATO Weekly Tax Table (Resident with Tax-Free Threshold - Scale 2)
    const { tax, netPay } = calculateWeeklyTax(gross);

    setBreakdown(payBreakdown);
    setTotalGross(gross);
    setEstimatedTax(tax);
    setEstimatedNet(netPay);
    setCalculated(true);
  };

  const handleUseAmount = () => {
    onCalculate(totalGross);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setBreakdown([]);
    setTotalGross(0);
    setEstimatedTax(0);
    setEstimatedNet(0);
    setCalculated(false);
    setBreakDuration(0);
    setTotalShiftHours(0);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1">
          <Calculator className="h-4 w-4" />
          Calculate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Coles Shift Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Date */}
          <div className="space-y-2">
            <Label htmlFor="shift-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date of Shift
            </Label>
            <Input
              id="shift-date"
              type="date"
              value={shiftDate}
              onChange={(e) => {
                setShiftDate(e.target.value);
                setCalculated(false);
              }}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setCalculated(false);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setCalculated(false);
                }}
              />
            </div>
          </div>

          {/* Age Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Age
            </Label>
            <Select value={age} onValueChange={(v) => {
              setAge(v as "20+" | "19" | "18");
              setCalculated(false);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20+">20 years & Adult</SelectItem>
                <SelectItem value="19">19 years</SelectItem>
                <SelectItem value="18">18 years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Public Holiday Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="public-holiday"
              checked={isPublicHoliday}
              onChange={(e) => {
                setIsPublicHoliday(e.target.checked);
                setCalculated(false);
              }}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="public-holiday" className="cursor-pointer">
              This is a Public Holiday
            </Label>
          </div>

          <Button onClick={calculatePay} className="w-full">
            Calculate Pay
          </Button>

          {/* Results */}
          {calculated && breakdown.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Shift Summary for {formatDate(shiftDate)}</h4>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {startTime} – {endTime} ({totalShiftHours.toFixed(1)} hrs shift)
                  </p>
                  {breakDuration > 0 && (
                    <p className="text-xs">
                      Break: {breakDuration * 60} min (unpaid) • Paid hours: {(totalShiftHours - breakDuration).toFixed(1)} hrs
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Breakdown</p>
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>{item.hours.toFixed(1)} hrs @ {item.rateName}</span>
                      <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Total Gross Pay</span>
                    <span className="text-success">${totalGross.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Estimated Tax</span>
                    <span>~${estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Net Pay</span>
                    <span>${estimatedNet.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-md text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>This is an estimate. Actual tax depends on total income, HECS/HELP debt, and tax-free threshold claims.</span>
                </div>

                <Button onClick={handleUseAmount} className="w-full" variant="default">
                  Use ${totalGross.toFixed(2)} as Coles Amount
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}