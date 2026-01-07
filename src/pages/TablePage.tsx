import { useData } from '@/contexts/DataContext';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateFinancialReport } from '@/utils/pdfGenerator';
import { EditIncomeDialog } from '@/components/EditIncomeDialog';
import { EditExpenseDialog } from '@/components/EditExpenseDialog';
import { formatAustraliaDate, toAustraliaTime } from '@/utils/timezone';

export default function TablePage() {
  const { incomes, expenses, loading, deleteIncome, deleteExpense, updateIncome, updateExpense } = useData();
  const { toast } = useToast();

  const handleExportPDF = () => {
    generateFinancialReport(incomes, expenses);
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

  const handleDeleteIncome = (id: string, date: string) => {
    deleteIncome(id);
    toast({
      title: "Income Deleted",
      description: `Income record for ${date} has been removed.`,
    });
  };

  const handleDeleteExpense = (id: string, name: string) => {
    deleteExpense(id);
    toast({
      title: "Expense Deleted", 
      description: `Expense "${name}" has been removed.`,
    });
  };

  // Helper to get source display name - shows "Unknown" if no source specified
  const getSourceName = (income: typeof incomes[0]) => {
    if (income.sourceName) return income.sourceName;
    if (income.doordash > 0) return 'DoorDash';
    if (income.ubereats > 0) return 'Uber Eats';
    if (income.didi > 0) return 'DiDi';
    if (income.coles > 0) return 'Coles';
    if (income.tips > 0) return 'Other';
    return 'Unknown';
  };

  // Group incomes by date for daily summary
  const dailySummary = incomes.reduce((acc, income) => {
    const dateKey = income.date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        sources: {} as Record<string, number>,
        total: 0
      };
    }
    
    const source = getSourceName(income);
    const amount = income.doordash + income.ubereats + income.didi + income.coles + income.tips;
    
    acc[dateKey].sources[source] = (acc[dateKey].sources[source] || 0) + amount;
    acc[dateKey].total += amount;
    
    return acc;
  }, {} as Record<string, { date: string; sources: Record<string, number>; total: number }>);

  // Sort by date descending
  const sortedDailySummary = Object.values(dailySummary)
    .sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime());

  // Combine and sort all transactions by date
  const allTransactions = [
    ...incomes.map(income => ({
      ...income,
      type: 'income' as const,
      total: income.doordash + income.ubereats + income.didi + income.coles + income.tips,
      sourceName: getSourceName(income)
    })),
    ...expenses.map(expense => ({
      ...expense,
      type: 'expense' as const,
      total: expense.amount
    }))
  ].sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime());

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Overview</h1>
            <p className="text-muted-foreground">Complete transaction history</p>
          </div>
          <Button onClick={handleExportPDF} variant="secondary">
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <Navigation />

      <div className="space-y-6">
        {/* Income Daily Summary Table */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="text-success">Income Records (Daily Summary)</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDailySummary.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No income records yet</p>
            ) : (
              <div className="space-y-4">
                {sortedDailySummary.map((day) => (
                  <div key={day.date} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                      <span className="font-semibold text-foreground">{formatAustraliaDate(day.date)}</span>
                      <span className="font-bold text-success">Total: ${day.total.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(day.sources).map(([source, amount]) => (
                        <div key={source} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{source}</span>
                          <span className="font-medium text-success">${amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Table */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="text-warning">Expense Records</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No expense records yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{formatAustraliaDate(expense.date)}</TableCell>
                      <TableCell>{expense.name}</TableCell>
                      <TableCell className="text-right font-bold text-warning">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id, expense.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Combined Timeline Table */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {allTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${transaction.id}`}>
                      <TableCell className="font-medium">{formatAustraliaDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'income' 
                          ? (transaction as any).sourceName || 'Income'
                          : (transaction as any).name
                        }
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        transaction.type === 'income' ? 'text-success' : 'text-warning'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {transaction.type === 'income' ? (
                            <EditIncomeDialog 
                              income={transaction as any} 
                              onUpdate={updateIncome}
                            />
                          ) : (
                            <EditExpenseDialog 
                              expense={transaction as any} 
                              onUpdate={updateExpense}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (transaction.type === 'income') {
                                handleDeleteIncome(transaction.id, transaction.date);
                              } else {
                                handleDeleteExpense(transaction.id, (transaction as any).name);
                              }
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
