import { DollarSign, TrendingUp, Calculator, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { Navigation } from "./Navigation";
import { IncomeForm } from "./IncomeForm";
import { ExpenseForm } from "./ExpenseForm";

export function Dashboard() {
  const { incomes, expenses, taxRate, addIncome, addExpense } = useData();

  // Calculate totals
  const totalIncome = incomes.reduce((sum, income) => 
    sum + income.doordash + income.ubereats + income.didi + income.coles, 0
  );
  
  // Calculate gig income (excluding Coles - no tax on employment income)
  const gigIncome = incomes.reduce((sum, income) => 
    sum + income.doordash + income.ubereats + income.didi, 0
  );
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const taxAmount = (gigIncome * taxRate) / 100;
  const netIncome = totalIncome - totalExpenses - taxAmount;


  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">GigZen Tracker</h1>
        <p className="text-muted-foreground">Track your gig income and expenses</p>
      </header>

      <Navigation />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
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
            {incomes.slice(-5).map((income) => (
              <Card key={income.id} className="stats-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">Daily Income</p>
                      <p className="text-sm text-muted-foreground">{income.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +${(income.doordash + income.ubereats + income.didi + income.coles).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DD: ${income.doordash} | UE: ${income.ubereats} | DiDi: ${income.didi} | Coles: ${income.coles}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {expenses.slice(-5).map((expense) => (
              <Card key={expense.id} className="stats-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">{expense.date}</p>
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