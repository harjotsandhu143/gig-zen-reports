import { FileDown, Target, Wallet, ChevronLeft, ChevronRight, TrendingUp, Receipt, DollarSign } from "lucide-react";
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  // === All calculations unchanged ===
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Gig Zen
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Your income & expense companion</p>
            </div>
            <Button 
              onClick={handleExportPDF} 
              variant="outline"
              size="sm"
              className="rounded-full border-border/60 hover:bg-secondary text-sm h-9 px-4"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </header>

        <Navigation />

        {/* Top Summary Cards */}
        <section className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
          {/* Total Income */}
          <MetricCard
            label="Total Income"
            value={`$${totalIncome.toFixed(2)}`}
            valueColor="text-success"
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-success/10"
            iconColor="text-success"
            subtitle={
              remaining > 0 
                ? `$${remaining.toFixed(2)} to target` 
                : remaining < 0 
                  ? `+$${Math.abs(remaining).toFixed(2)} over target` 
                  : 'Target reached'
            }
            delay={0}
          />

          {/* After Expenses */}
          <MetricCard
            label="After Expenses"
            value={`$${netBalance.toFixed(2)}`}
            valueColor={netBalance >= 0 ? 'text-success' : 'text-destructive'}
            icon={<Wallet className="h-4 w-4" />}
            iconBg="bg-primary/8"
            iconColor="text-primary"
            subtitle={`Expenses: $${totalExpenses.toFixed(2)}`}
            delay={0.05}
          />

          {/* Today's Earnings */}
          <MetricCard
            label="Today (Gross)"
            value={`$${todaysGrossIncome.toFixed(2)}`}
            valueColor="text-foreground"
            icon={<TrendingUp className="h-4 w-4" />}
            iconBg="bg-success/10"
            iconColor="text-success"
            delay={0.1}
          />

          {/* Today's Gig */}
          <MetricCard
            label="Today's Gig"
            value={`$${(todayDoordash + todayUbereats + todayDidi + todayTips).toFixed(2)}`}
            valueColor="text-foreground"
            icon={<DollarSign className="h-4 w-4" />}
            iconBg="bg-muted"
            iconColor="text-muted-foreground"
            delay={0.15}
          />
        </section>

        {/* Coles Weekly Summary */}
        {hasAnyColes && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">Coles Weekly</span>
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
                    <div className="text-center p-4 rounded-xl bg-secondary/50">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Gross</p>
                      <p className="text-xl font-semibold text-foreground">${weeklyColesIncome.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-warning/5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Tax</p>
                      <p className="text-xl font-semibold text-warning">${weeklyTax.toFixed(2)}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-success/5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Net</p>
                      <p className="text-xl font-semibold text-success">${weeklyNetPay.toFixed(2)}</p>
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

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {/* Weekly Target Input */}
          <Card className="rounded-2xl border-border/50 shadow-sm animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/8">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="weekly-target" className="text-[11px] uppercase tracking-wider text-muted-foreground">Weekly Target</Label>
                  <Input
                    id="weekly-target"
                    type="number"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onBlur={handleTargetUpdate}
                    onKeyDown={(e) => e.key === 'Enter' && handleTargetUpdate()}
                    className="h-10 text-2xl font-semibold border-0 bg-transparent p-0 mt-0.5 focus-visible:ring-0"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="rounded-2xl border-border/50 shadow-sm animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-semibold mt-0.5 text-success">${totalIncome.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {remaining > 0 
                      ? <span className="text-warning">${remaining.toFixed(2)} left</span>
                      : remaining < 0 
                        ? <span className="text-success">+${Math.abs(remaining).toFixed(2)} over</span>
                        : <span className="text-success">Target reached</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gig Income */}
          <Card className="rounded-2xl border-border/50 shadow-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Gig Income</p>
                  <p className="text-2xl font-semibold mt-0.5 text-foreground">${gigIncome.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    DoorDash + Uber + DiDi + Tips
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Ring */}
          <Card className="rounded-2xl border-border/50 shadow-sm animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Earned', value: Math.min(totalIncome, weeklyTarget || 1) },
                          { name: 'Remaining', value: Math.max(0, (weeklyTarget || 1) - totalIncome) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={26}
                        outerRadius={38}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill="hsl(var(--success))" />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-foreground">
                      {weeklyTarget > 0 ? `${Math.min(100, Math.round((totalIncome / weeklyTarget) * 100))}%` : '0%'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Net Balance</p>
                  <p className="text-2xl font-semibold text-foreground mt-0.5">${netBalance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Income − Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Forms */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <UniversalIncomeForm onIncomeAdd={addUniversalIncome} />
          <ExpenseForm onExpenseAdd={addExpense} />
        </section>

        {/* Income Breakdown */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Income Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'DoorDash', weekly: doordashIncome, today: todayDoordash },
                      { name: 'Uber Eats', weekly: ubereatsIncome, today: todayUbereats },
                      { name: 'DiDi', weekly: didiIncome, today: todayDidi },
                      { name: 'Coles (Net)', weekly: colesNetIncome, today: todayColesNet },
                      { name: 'Other', weekly: tipsIncome, today: todayTips }
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
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
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        fontSize: '13px',
                      }}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    />
                    <Bar dataKey="weekly" radius={[0, 6, 6, 0]} barSize={16} name="weekly">
                      <Cell fill="hsl(var(--destructive))" />
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--warning))" />
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted-foreground))" />
                    </Bar>
                    <Bar dataKey="today" radius={[0, 6, 6, 0]} barSize={16} name="today">
                      <Cell fill="hsl(var(--destructive) / 0.4)" />
                      <Cell fill="hsl(var(--success) / 0.4)" />
                      <Cell fill="hsl(var(--warning) / 0.4)" />
                      <Cell fill="hsl(var(--primary) / 0.4)" />
                      <Cell fill="hsl(var(--muted-foreground) / 0.4)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
                  <span className="text-muted-foreground">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-success/40"></div>
                  <span className="text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimer */}
        <p className="text-[11px] text-center text-muted-foreground/60 mb-6">
          Estimate only — not financial advice.
        </p>
      </div>
    </div>
  );
}

/* Reusable Metric Card */
function MetricCard({ 
  label, value, valueColor, icon, iconBg, iconColor, subtitle, delay = 0 
}: {
  label: string;
  value: string;
  valueColor: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <Card 
      className="rounded-2xl border-border/50 shadow-sm animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`text-xl md:text-2xl font-semibold tracking-tight ${valueColor}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
