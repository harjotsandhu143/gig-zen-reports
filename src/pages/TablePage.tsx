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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
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

  const getSourceName = (income: typeof incomes[0]) => {
    if (income.sourceName) return income.sourceName;
    if (income.doordash > 0) return 'DoorDash';
    if (income.ubereats > 0) return 'Uber Eats';
    if (income.didi > 0) return 'DiDi';
    if (income.coles > 0) return 'Coles';
    if (income.tips > 0) return 'Other';
    return 'Unknown';
  };

  const sortedIncomes = [...incomes].sort((a, b) => 
    toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
  );

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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Data</h1>
              <p className="text-muted-foreground text-sm mt-1">Complete transaction history</p>
            </div>
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="rounded-full h-9 px-4 border-border/60 text-sm">
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </header>

        <Navigation />

        <div className="space-y-6">
          {/* Income Table */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-success">Income Records</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedIncomes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No income records yet</p>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[11px] uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">DoorDash</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Uber Eats</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">DiDi</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Coles</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Tips</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Total</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedIncomes.map((income) => {
                        const total = income.doordash + income.ubereats + income.didi + income.coles + income.tips;
                        return (
                          <TableRow key={income.id} className="border-border/30">
                            <TableCell className="font-medium text-sm">{formatAustraliaDate(income.date)}</TableCell>
                            <TableCell className="text-right text-sm">${income.doordash.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">${income.ubereats.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">${income.didi.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">${income.coles.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">${income.tips.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm text-success">${total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <EditIncomeDialog income={income} onUpdate={updateIncome} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteIncome(income.id, income.date)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Table */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-warning">Expense Records</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No expense records yet</p>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[11px] uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider">Description</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Amount</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id} className="border-border/30">
                          <TableCell className="font-medium text-sm">{formatAustraliaDate(expense.date)}</TableCell>
                          <TableCell className="text-sm">{expense.name}</TableCell>
                          <TableCell className="text-right font-semibold text-sm text-warning">
                            ${expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id, expense.name)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Transaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {allTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No transactions yet</p>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-[11px] uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider">Type</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider">Description</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Amount</TableHead>
                        <TableHead className="text-right text-[11px] uppercase tracking-wider">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTransactions.map((transaction) => (
                        <TableRow key={`${transaction.type}-${transaction.id}`} className="border-border/30">
                          <TableCell className="font-medium text-sm">{formatAustraliaDate(transaction.date)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.type === 'income' ? 'default' : 'destructive'}
                              className="rounded-full text-[10px] font-medium px-2 py-0.5"
                            >
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.type === 'income' 
                              ? (transaction as any).sourceName || 'Income'
                              : (transaction as any).name
                            }
                          </TableCell>
                          <TableCell className={`text-right font-semibold text-sm ${
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
                                size="icon"
                                onClick={() => {
                                  if (transaction.type === 'income') {
                                    handleDeleteIncome(transaction.id, transaction.date);
                                  } else {
                                    handleDeleteExpense(transaction.id, (transaction as any).name);
                                  }
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
