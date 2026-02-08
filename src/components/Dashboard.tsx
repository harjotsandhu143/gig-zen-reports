import { FileDown, Target, Wallet, ChevronLeft, ChevronRight, TrendingUp, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { Navigation } from "./Navigation";
import { UniversalIncomeForm } from "./UniversalIncomeForm";
import { ExpenseForm } from "./ExpenseForm";
import { Onboarding } from "./Onboarding";

import { generateFinancialReport } from "@/utils/pdfGenerator";
import { formatAustraliaDate, toAustraliaTime, getAustraliaWeekBounds } from "@/utils/timezone";
import { calculateWeeklyTax } from "@/utils/taxCalculator";
import { useState, useEffect } from "react";
import { addWeeks, format } from "date-fns";

export function Dashboard() {
  const { 
    incomes, 
    expenses, 
    weeklyTarget, 
    setWeeklyTarget, 
    loading, 
    addUniversalIncome,
    addExpense,
    hasCompletedOnboarding,
    completeOnboarding
  } = useData();
  const [targetInput, setTargetInput] = useState(weeklyTarget.toString());
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  useEffect(() => {
    setTargetInput(weeklyTarget.toString());
  }, [weeklyTarget]);

  const handleTargetUpdate = () => {
    const target = parseFloat(targetInput) || 0;
    setWeeklyTarget(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground/20 border-t-foreground/60 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const doordashIncome = incomes.reduce((sum, income) => sum + income.doordash, 0);
  const ubereatsIncome = incomes.reduce((sum, income) => sum + income.ubereats, 0);
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  const tipsIncome = incomes.reduce((sum, income) => sum + income.tips, 0);
  const colesGrossIncome = incomes.reduce((sum, income) => sum + income.coles, 0);
  const { tax: totalColesTax } = calculateWeeklyTax(colesGrossIncome);
  const colesNetIncome = colesGrossIncome - totalColesTax;
  const gigIncome = doordashIncome + ubereatsIncome + didiIncome + tipsIncome;
  const totalGrossIncome = colesGrossIncome + gigIncome;
  const totalIncome = colesNetIncome + gigIncome;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const remaining = weeklyTarget - totalIncome;

  const today = formatAustraliaDate(new Date(), 'yyyy-MM-dd');
  const todaysIncomes = incomes.filter(income => formatAustraliaDate(income.date, 'yyyy-MM-dd') === today);
  const todayDoordash = todaysIncomes.reduce((sum, income) => sum + income.doordash, 0);
  const todayUbereats = todaysIncomes.reduce((sum, income) => sum + income.ubereats, 0);
  const todayDidi = todaysIncomes.reduce((sum, income) => sum + income.didi, 0);
  const todayTips = todaysIncomes.reduce((sum, income) => sum + income.tips, 0);
  const todayColesGross = todaysIncomes.reduce((sum, income) => sum + income.coles, 0);
  const { tax: todayColesTax } = calculateWeeklyTax(todayColesGross);
  const todayColesNet = todayColesGross - todayColesTax;
  const todaysGrossIncome = todayDoordash + todayUbereats + todayDidi + todayTips + todayColesGross;

  const selectedWeekDate = addWeeks(new Date(), selectedWeekOffset);
  const selectedWeekBounds = getAustraliaWeekBounds(selectedWeekDate);
  const weeklyColesIncome = incomes
    .filter(income => {
      const incomeDate = toAustraliaTime(income.date);
      return incomeDate >= selectedWeekBounds.start && incomeDate <= selectedWeekBounds.end;
    })
    .reduce((sum, income) => sum + income.coles, 0);
  const { tax: weeklyTax, netPay: weeklyNetPay } = calculateWeeklyTax(weeklyColesIncome);
  const hasAnyColes = incomes.some(income => income.coles > 0);

  const handleExportPDF = () => {
    generateFinancialReport(incomes, expenses);
  };

  const barChartData = [
    { name: 'DoorDash', weekly: doordashIncome, today: todayDoordash },
    { name: 'Uber Eats', weekly: ubereatsIncome, today: todayUbereats },
    { name: 'DiDi', weekly: didiIncome, today: todayDidi },
    { name: 'Coles (Net)', weekly: colesNetIncome, today: todayColesNet },
    { name: 'Other', weekly: tipsIncome, today: todayTips }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-8 md:pt-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Gig Zen
            </h1>
            <Button 
              onClick={handleExportPDF} 
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground hover:text-foreground text-sm h-9 px-4"
            >
              <FileDown className="w-4 h-4 mr-1.5" />
              Export
            </Button>
          </div>
        </header>

        <Navigation />

        {/* Hero Cards — Total Income & After Expenses */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-md)]">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Total Income</p>
              <p className="text-3xl md:text-4xl font-bold tracking-tight text-success">
                ${totalIncome.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {remaining > 0 
                  ? `$${remaining.toFixed(2)} to target` 
                  : remaining < 0 
                    ? `+$${Math.abs(remaining).toFixed(2)} over target` 
                    : 'Target reached'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-[var(--shadow-md)]">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">After Expenses</p>
              <p className={`text-3xl md:text-4xl font-bold tracking-tight ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${netBalance.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Expenses: ${totalExpenses.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Secondary Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <SecondaryCard label="Today (Gross)" value={`$${todaysGrossIncome.toFixed(2)}`} />
          <SecondaryCard label="Today's Gig" value={`$${(todayDoordash + todayUbereats + todayDidi + todayTips).toFixed(2)}`} />
          <SecondaryCard label="Gig Income" value={`$${gigIncome.toFixed(2)}`} />
          <div className="flex items-center justify-center">
            <Card className="rounded-2xl border-0 shadow-[var(--shadow)] w-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Earned', value: Math.min(totalIncome, weeklyTarget || 1) },
                          { name: 'Remaining', value: Math.max(0, (weeklyTarget || 1) - totalIncome) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={26}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill="hsl(var(--success))" />
                        <Cell fill="hsl(var(--border))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-foreground">
                      {weeklyTarget > 0 ? `${Math.min(100, Math.round((totalIncome / weeklyTarget) * 100))}%` : '0%'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</p>
                  <p className="text-lg font-semibold text-foreground">${weeklyTarget.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Weekly Target Input */}
        <section className="mb-6">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow)]">
            <CardContent className="p-5 flex items-center gap-4">
              <Target className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="weekly-target" className="text-[11px] uppercase tracking-wider text-muted-foreground">Weekly Target</Label>
                <Input
                  id="weekly-target"
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onBlur={handleTargetUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleTargetUpdate()}
                  className="h-9 text-xl font-semibold border-0 bg-transparent p-0 mt-0.5 focus-visible:ring-0"
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Coles Weekly Summary */}
        {hasAnyColes && (
          <section className="mb-8">
            <Card className="rounded-2xl border-0 shadow-[var(--shadow)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Coles Weekly</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                      className="h-7 w-7 rounded-full"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground min-w-[120px] text-center">
                      {selectedWeekOffset === 0 
                        ? "This Week" 
                        : `Week of ${format(selectedWeekBounds.start, 'MMM d')}`
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                      disabled={selectedWeekOffset >= 0}
                      className="h-7 w-7 rounded-full"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyColesIncome > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-xl bg-secondary">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Gross</p>
                      <p className="text-lg font-semibold text-foreground">${weeklyColesIncome.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-secondary">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Tax</p>
                      <p className="text-lg font-semibold text-foreground">${weeklyTax.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-secondary">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Net</p>
                      <p className="text-lg font-semibold text-success">${weeklyNetPay.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No Coles income for this week
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Forms — equal width pill buttons */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <UniversalIncomeForm onIncomeAdd={addUniversalIncome} />
          <ExpenseForm onExpenseAdd={addExpense} />
        </section>

        {/* Income Breakdown — grayscale with green accent */}
        <section className="mb-8">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">
                Income Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 65, bottom: 0 }}
                  >
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `$${value}`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${value.toFixed(2)}`, 
                        name === 'weekly' ? 'Total' : 'Today'
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        fontSize: '13px',
                      }}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    />
                    <Bar dataKey="weekly" radius={[0, 4, 4, 0]} barSize={14} name="weekly" fill="hsl(var(--foreground) / 0.18)" />
                    <Bar dataKey="today" radius={[0, 4, 4, 0]} barSize={14} name="today" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-foreground/18"></div>
                  <span className="text-muted-foreground">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <p className="text-[11px] text-center text-muted-foreground/50 mb-6">
          Estimate only — not financial advice.
        </p>
      </div>
    </div>
  );
}

/* Secondary metric card — small, monochrome */
function SecondaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-0 shadow-[var(--shadow)]">
      <CardContent className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
