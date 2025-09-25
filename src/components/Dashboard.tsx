import { DollarSign, TrendingUp, Calculator, PiggyBank, FileDown, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { Navigation } from "./Navigation";
import { IncomeForm } from "./IncomeForm";
import { ExpenseForm } from "./ExpenseForm";
import { generateFinancialReport } from "@/utils/pdfGenerator";
import { formatAustraliaDate, toAustraliaTime } from "@/utils/timezone";

export function Dashboard() {
  const { incomes, expenses, taxRate, loading, canUndo, undo, addIncome, addExpense } = useData();

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

  // Calculate totals
  const totalIncome = incomes.reduce((sum, income) => 
    sum + income.doordash + income.ubereats + income.didi + income.coles + income.tips, 0
  );
  
  // Calculate gig income (excluding Coles - no tax on employment income)
  const gigIncome = incomes.reduce((sum, income) => 
    sum + income.doordash + income.ubereats + income.didi + income.tips, 0
  );

  // Calculate DiDi specific income for GST
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
              .map((income) => (
              <Card key={income.id} className="stats-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">Daily Income</p>
                      <p className="text-sm text-muted-foreground">{formatAustraliaDate(income.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +${(income.doordash + income.ubereats + income.didi + income.coles + income.tips).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DD: ${income.doordash} | UE: ${income.ubereats} | DiDi: ${income.didi} | Coles: ${income.coles} | Tips: ${income.tips}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
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