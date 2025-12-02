import { DollarSign, TrendingUp, Calculator, PiggyBank, FileDown, Undo2, Target, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/contexts/DataContext";
import { Navigation } from "./Navigation";
import { IncomeForm } from "./IncomeForm";
import { ExpenseForm } from "./ExpenseForm";
import { generateFinancialReport } from "@/utils/pdfGenerator";
import { formatAustraliaDate, toAustraliaTime, getAustraliaWeekBounds } from "@/utils/timezone";
import { calculateWeeklyTax } from "@/utils/taxCalculator";
import { useState, useEffect } from "react";
import { addWeeks, format } from "date-fns";

export function Dashboard() {
  const { incomes, expenses, taxRate, weeklyTarget, setWeeklyTarget, loading, canUndo, undo, addIncome, addExpense } = useData();
  const [targetInput, setTargetInput] = useState(weeklyTarget.toString());
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

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

  // Calculate totals by income source
  const doordashIncome = incomes.reduce((sum, income) => sum + income.doordash, 0);
  const ubereatsIncome = incomes.reduce((sum, income) => sum + income.ubereats, 0);
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  const tipsIncome = incomes.reduce((sum, income) => sum + income.tips, 0);
  const colesGrossIncome = incomes.reduce((sum, income) => sum + income.coles, 0);
  
  // Calculate total Coles tax across all entries
  let totalColesTax = 0;
  incomes.forEach(income => {
    if (income.coles > 0) {
      const { tax } = calculateWeeklyTax(income.coles);
      totalColesTax += tax;
    }
  });
  
  const colesNetIncome = colesGrossIncome - totalColesTax;
  const gigIncome = doordashIncome + ubereatsIncome + didiIncome + tipsIncome;
  
  // Total income = Coles (Net after tax) + Gig income (Gross)
  const totalIncome = colesNetIncome + gigIncome;
  
  // Debug logging
  console.log('Coles Gross:', colesGrossIncome);
  console.log('Coles Tax:', totalColesTax);
  console.log('Coles Net:', colesNetIncome);
  console.log('Gig Income:', gigIncome);
  console.log('Total Income:', totalIncome);
  
  // Calculate remaining to meet target
  const remaining = weeklyTarget - totalIncome;
  
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
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const taxableIncome = Math.max(0, gigIncome - totalExpenses); // Don't tax negative income
  const taxAmount = (taxableIncome * taxRate) / 100;
  
  // DiDi GST calculation: (DiDi Earnings - Total Expenses) × 10%
  const didiGstAmount = (didiIncome - totalExpenses) * 0.1;
  
  // Debug logging
  console.log('DiDi Income:', didiIncome);
  console.log('Total Expenses:', totalExpenses); 
  console.log('DiDi GST Amount:', didiGstAmount);
  
  const netIncome = totalIncome - totalExpenses - taxAmount;

  const handleExportPDF = () => {
    generateFinancialReport(incomes, expenses, taxRate);
  };


  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Income Tracker</h1>
            <p className="text-muted-foreground">Track your gig income and expenses</p>
          </div>
          <Button onClick={handleExportPDF} variant="secondary">
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <Navigation />

      {/* Weekly Coles Tax Summary */}
      {hasAnyColes && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" />
                Coles Weekly Tax Summary (ATO Scale 2)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-normal text-muted-foreground min-w-[140px] text-center">
                  {selectedWeekOffset === 0 
                    ? "This Week" 
                    : `Week of ${format(selectedWeekBounds.start, 'MMM d')}`
                  }
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                  disabled={selectedWeekOffset >= 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyColesIncome > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gross Amount</p>
                    <p className="text-xl font-bold text-foreground">${weeklyColesIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tax Deducted</p>
                    <p className="text-xl font-bold text-warning">${weeklyTax.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Pay</p>
                    <p className="text-xl font-bold text-success">${weeklyNetPay.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Tax calculated using ATO Weekly Tax Table (Resident with Tax-Free Threshold)
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No Coles income for this week
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Weekly Target Input Card */}
        <Card className="stats-card col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-light">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label htmlFor="weekly-target" className="text-sm text-muted-foreground">Weekly Target</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="weekly-target"
                    type="number"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onBlur={handleTargetUpdate}
                    onKeyDown={(e) => e.key === 'Enter' && handleTargetUpdate()}
                    className="h-8 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Amount Card */}
        <Card className="stats-card col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${remaining > 0 ? 'bg-warning-light' : 'bg-success-light'}`}>
                <Calculator className={`h-5 w-5 ${remaining > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remaining > 0 ? 'text-warning' : 'text-success'}`}>
                  ${Math.abs(remaining).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {remaining > 0 ? 'To reach target' : 'Target exceeded!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-light">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-foreground">${totalIncome.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning-light">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-light">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax ({taxRate}%)</p>
                <p className="text-2xl font-bold text-foreground">${taxAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Calculator className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DiDi GST Amount</p>
                <p className={`text-lg font-bold ${didiGstAmount >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {didiGstAmount >= 0 ? '+' : ''}${didiGstAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-light">
                <PiggyBank className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-2xl font-bold text-foreground">${netIncome.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Form */}
      <div className="mb-8">
        <IncomeForm onIncomeAdd={addIncome} />
      </div>

      {/* Expense Form */}
      <div className="mb-8">
        <ExpenseForm onExpenseAdd={addExpense} />
      </div>

      {/* Undo Button */}
      {canUndo && (
        <div className="mb-6 flex justify-center">
          <Button
            onClick={undo}
            variant="outline"
            size="sm"
            className="text-primary hover:text-primary-foreground hover:bg-primary"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo Last Action
          </Button>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
        
        {incomes.length === 0 && expenses.length === 0 ? (
          <Card className="stats-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No transactions yet. Add your first income or expense above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {incomes
              .sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime())
              .slice(0, 5)
              .map((income) => {
                // Calculate net Coles for this entry
                const colesNet = income.coles > 0 ? income.coles - calculateWeeklyTax(income.coles).tax : 0;
                const dailyTotal = income.doordash + income.ubereats + income.didi + colesNet + income.tips;
                
                return (
              <Card key={income.id} className="stats-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">Daily Income</p>
                      <p className="text-sm text-muted-foreground">{formatAustraliaDate(income.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +${dailyTotal.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DD: ${income.doordash} | UE: ${income.ubereats} | DiDi: ${income.didi} | Coles: ${colesNet.toFixed(2)} | Tips: ${income.tips}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              })}
            
            {expenses
              .sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime())
              .slice(0, 5)
              .map((expense) => (
              <Card key={expense.id} className="stats-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">{formatAustraliaDate(expense.date)}</p>
                    </div>
                    <p className="text-lg font-bold text-warning">-${expense.amount.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}