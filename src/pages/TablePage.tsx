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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TablePage() {
  const { incomes, expenses, deleteIncome, deleteExpense } = useData();
  const { toast } = useToast();

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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Overview</h1>
        <p className="text-muted-foreground">Complete transaction history</p>
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell className="font-medium">{income.date}</TableCell>
                      <TableCell>${income.doordash.toFixed(2)}</TableCell>
                      <TableCell>${income.ubereats.toFixed(2)}</TableCell>
                      <TableCell>${income.didi.toFixed(2)}</TableCell>
                      <TableCell>${income.coles.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        ${(income.doordash + income.ubereats + income.didi + income.coles).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIncome(income.id, income.date)}
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
                      <TableCell className="font-medium">{expense.date}</TableCell>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${transaction.id}`}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
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