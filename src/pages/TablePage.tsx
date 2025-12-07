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
  const { incomes, expenses, loading, deleteIncome, deleteExpense, updateIncome, updateExpense, taxRate } = useData();
  const { toast } = useToast();

  const handleExportPDF = () => {
    generateFinancialReport(incomes, expenses, taxRate);
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

  // Combine and sort all transactions by date
  const allTransactions = [
    ...incomes.map(income => ({
      ...income,
      type: 'income' as const,
      total: income.doordash + income.ubereats + income.didi + income.coles
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
        {/* Income Table */}
        <Card className="stats-card">
          <CardHeader>
            <CardTitle className="text-success">Income Records</CardTitle>
          </CardHeader>
          <CardContent>
            {incomes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No income records yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>DoorDash</TableHead>
                    <TableHead>Uber Eats</TableHead>
                    <TableHead>DiDi</TableHead>
                    <TableHead>Coles</TableHead>
                    <TableHead>Tips</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{formatAustraliaDate(income.date)}</TableCell>
                      <TableCell>${income.doordash.toFixed(2)}</TableCell>
                      <TableCell>${income.ubereats.toFixed(2)}</TableCell>
                      <TableCell>${income.didi.toFixed(2)}</TableCell>
                      <TableCell>${income.coles.toFixed(2)}</TableCell>
                      <TableCell>${income.tips.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        ${(income.doordash + income.ubereats + income.didi + income.coles + income.tips).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <EditIncomeDialog 
                            income={income} 
                            onUpdate={updateIncome}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIncome(income.id, income.date)}
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
                          ? 'Daily Income' 
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
