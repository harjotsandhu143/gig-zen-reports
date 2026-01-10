import { FileDown, Target, Wallet, ChevronLeft, ChevronRight, TrendingUp, Receipt } from "lucide-react";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  // Calculate totals by income source
  const doordashIncome = incomes.reduce((sum, income) => sum + income.doordash, 0);
  const ubereatsIncome = incomes.reduce((sum, income) => sum + income.ubereats, 0);
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  const tipsIncome = incomes.reduce((sum, income) => sum + income.tips, 0);
  const colesGrossIncome = incomes.reduce((sum, income) => sum + income.coles, 0);
  
  // Calculate Coles tax on weekly total (ATO tax table is designed for weekly totals)
  const { tax: totalColesTax } = calculateWeeklyTax(colesGrossIncome);
  
  const colesNetIncome = colesGrossIncome - totalColesTax;
  const gigIncome = doordashIncome + ubereatsIncome + didiIncome + tipsIncome;
  
  // Total gross income (before any tax) - for reference only
  const totalGrossIncome = colesGrossIncome + gigIncome;
  
  // Total income = Coles (Net after tax) + Gig income (Gross)
  // This is the actual money you receive
  const totalIncome = colesNetIncome + gigIncome;
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Net Balance = Total Income - Expenses (simple, no tax estimation)
  const netBalance = totalIncome - totalExpenses;
  
  // Calculate remaining to meet target (based on total income with Coles NET)
  const remaining = weeklyTarget - totalIncome;
  
  // Calculate today's earnings (GROSS - Sydney timezone)
  const today = formatAustraliaDate(new Date(), 'yyyy-MM-dd');
  const todaysIncomes = incomes.filter(income => formatAustraliaDate(income.date, 'yyyy-MM-dd') === today);
  
  const todayDoordash = todaysIncomes.reduce((sum, income) => sum + income.doordash, 0);
  const todayUbereats = todaysIncomes.reduce((sum, income) => sum + income.ubereats, 0);
  const todayDidi = todaysIncomes.reduce((sum, income) => sum + income.didi, 0);
  const todayTips = todaysIncomes.reduce((sum, income) => sum + income.tips, 0);
  const todayColesGross = todaysIncomes.reduce((sum, income) => sum + income.coles, 0);
  const { tax: todayColesTax } = calculateWeeklyTax(todayColesGross);
  const todayColesNet = todayColesGross - todayColesTax;
  
  // Today's earnings is GROSS (before any tax)
  const todaysGrossIncome = todayDoordash + todayUbereats + todayDidi + todayTips + todayColesGross;
  
  // Calculate weekly Coles income with tax for selected week
  const selectedWeekDate = addWeeks(new Date(), selectedWeekOffset);
  const selectedWeekBounds = getAustraliaWeekBounds(selectedWeekDate);
  const weeklyColesIncome = incomes
    .filter(income => {
      const incomeDate = toAustraliaTime(income.date);
      return incomeDate >= selectedWeekBounds.start && incomeDate <= selectedWeekBounds.end;
    })
    .reduce((sum, income) => sum + income.coles, 0);
  
  const { tax: weeklyTax, netPay: weeklyNetPay } = calculateWeeklyTax(weeklyColesIncome);
  
  // Check if there's any Coles income in any week
  const hasAnyColes = incomes.some(income => income.coles > 0);

  const handleExportPDF = () => {
    generateFinancialReport(incomes, expenses);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-24">
      <header className="mb-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent mb-1">
              Gig Zen
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">Your income & expense companion</p>
          </div>
          <Button 
            onClick={handleExportPDF} 
            variant="outline"
            className="border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-lg"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <Navigation />

      {/* Top Summary Cards - Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Total Income with Remaining Target */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-success/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">Total Income</p>
                <p className="text-xl md:text-2xl font-bold text-success">
                  ${totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {remaining > 0 
                    ? `$${remaining.toFixed(2)} to target` 
                    : remaining < 0 
                      ? `+$${Math.abs(remaining).toFixed(2)} over target!` 
                      : 'Target reached!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-warning/10" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10">
                <Receipt className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">Expenses</p>
                <p className="text-xl md:text-2xl font-bold text-warning">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Earnings */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-success/10" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">Today (Gross)</p>
                <p className="text-xl md:text-2xl font-bold text-success">
                  ${todaysGrossIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Coles Tax Summary */}
      {hasAnyColes && (
        <Card className="mb-8 border border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-lg animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span>Coles Weekly Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground min-w-[140px] text-center">
                  {selectedWeekOffset === 0 
                    ? "This Week" 
                    : `Week of ${format(selectedWeekBounds.start, 'MMM d')}`
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                  disabled={selectedWeekOffset >= 0}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyColesIncome > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-xl bg-background/50">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Gross</p>
                  <p className="text-2xl font-bold text-foreground">${weeklyColesIncome.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-warning/5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tax</p>
                  <p className="text-2xl font-bold text-warning">${weeklyTax.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-success/5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Net</p>
                  <p className="text-2xl font-bold text-success">${weeklyNetPay.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No Coles income for this week
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {/* Weekly Target Input Card */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl transition-colors bg-primary/10 group-hover:bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Label htmlFor="weekly-target" className="text-xs uppercase tracking-wide text-muted-foreground">Weekly Target</Label>
                <Input
                  id="weekly-target"
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onBlur={handleTargetUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleTargetUpdate()}
                  className="h-12 text-3xl font-bold border-0 bg-transparent p-0 mt-1 focus-visible:ring-0"
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Income Card */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-gradient-to-br from-card to-success/10" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl transition-colors bg-success/10 group-hover:bg-success/20">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Income</p>
                <p className="text-3xl font-bold mt-1 text-success">
                  ${totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coles Net + Gig Gross
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Target Progress Pie Chart */}
        <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-success/5 animate-fade-in md:col-span-2 lg:col-span-1" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Earned', value: Math.min(totalIncome, weeklyTarget || 1) },
                        { name: 'Remaining', value: Math.max(0, (weeklyTarget || 1) - totalIncome) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="hsl(var(--success))" />
                      <Cell fill="hsl(var(--muted) / 0.3)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">
                    {weeklyTarget > 0 ? `${Math.min(100, Math.round((totalIncome / weeklyTarget) * 100))}%` : '0%'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Net Balance</p>
                <p className="text-3xl font-bold text-success mt-1">${netBalance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">Income - Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income and Expense Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <UniversalIncomeForm onIncomeAdd={addUniversalIncome} />
        <ExpenseForm onExpenseAdd={addExpense} />
      </div>

      {/* Income Breakdown Bar Chart */}
      <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-card to-primary/5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-primary"></div>
            Income Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
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
                margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
              >
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`, 
                    name === 'weekly' ? 'Total' : 'Today'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px hsl(var(--foreground) / 0.1)'
                  }}
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                />
                <Bar dataKey="weekly" radius={[0, 8, 8, 0]} barSize={20} name="weekly">
                  <Cell fill="hsl(var(--destructive))" />
                  <Cell fill="hsl(var(--success))" />
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted-foreground))" />
                </Bar>
                <Bar dataKey="today" radius={[0, 8, 8, 0]} barSize={20} name="today">
                  <Cell fill="hsl(var(--destructive) / 0.5)" />
                  <Cell fill="hsl(var(--success) / 0.5)" />
                  <Cell fill="hsl(var(--warning) / 0.5)" />
                  <Cell fill="hsl(var(--primary) / 0.5)" />
                  <Cell fill="hsl(var(--muted-foreground) / 0.5)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-success"></div>
              <span className="text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-success/50"></div>
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground mb-4">
        Estimate only — not financial advice.
      </p>
    </div>
  );
}
