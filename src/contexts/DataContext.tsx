import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Income {
  id: string;
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
}

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
}

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  taxRate: number;
  setTaxRate: (rate: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxRate, setTaxRateState] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMigratedLocalData, setHasMigratedLocalData] = useState(false);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setIncomes([]);
      setExpenses([]);
      setTaxRateState(20);
      setIsLoading(false);
      return;
    }

    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load incomes
      const { data: incomesData, error: incomesError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (incomesError) throw incomesError;

      // Load expenses  
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Load user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // Transform data to match existing interface
      const transformedIncomes = incomesData?.map(income => ({
        id: income.id,
        date: income.date,
        doordash: Number(income.doordash || 0),
        ubereats: Number(income.ubereats || 0),
        didi: Number(income.didi || 0),
        coles: Number(income.coles || 0)
      })) || [];

      const transformedExpenses = expensesData?.map(expense => ({
        id: expense.id,
        date: expense.date,
        name: expense.name,
        amount: Number(expense.amount)
      })) || [];

      setIncomes(transformedIncomes);
      setExpenses(transformedExpenses);
      setTaxRateState(Number(settingsData?.tax_rate || 20));

      // Migrate localStorage data if this is the first load and user has no data
      if (!hasMigratedLocalData && transformedIncomes.length === 0 && transformedExpenses.length === 0) {
        await migrateLocalStorageData();
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try refreshing.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      // Get data from localStorage
      const savedIncomes = localStorage.getItem('gigzen-incomes');
      const savedExpenses = localStorage.getItem('gigzen-expenses');
      const savedTaxRate = localStorage.getItem('gigzen-taxrate');

      const localIncomes = savedIncomes ? JSON.parse(savedIncomes) : [];
      const localExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];
      const localTaxRate = savedTaxRate ? parseFloat(savedTaxRate) : 20;

      // Migrate incomes
      for (const income of localIncomes) {
        await supabase
          .from('incomes')
          .upsert({
            user_id: user.id,
            date: income.date,
            doordash: income.doordash || 0,
            ubereats: income.ubereats || 0,
            didi: income.didi || 0,
            coles: income.coles || 0
          }, {
            onConflict: 'user_id,date'
          });
      }

      // Migrate expenses
      for (const expense of localExpenses) {
        await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            date: expense.date,
            name: expense.name,
            amount: expense.amount
          });
      }

      // Migrate tax rate
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          tax_rate: localTaxRate
        }, {
          onConflict: 'user_id'
        });

      setHasMigratedLocalData(true);
      
      // Reload data after migration
      await loadUserData();
      
      if (localIncomes.length > 0 || localExpenses.length > 0) {
        toast({
          title: "Data Migrated",
          description: "Your existing data has been migrated to the cloud!"
        });
      }
      
    } catch (error) {
      console.error('Error migrating localStorage data:', error);
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!user) return;

    try {
      // Check if income exists for this date
      const { data: existing } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', income.date)
        .maybeSingle();

      if (existing) {
        // Update existing with same logic as before
        const updatedIncome = {
          doordash: Number(existing.doordash || 0) + income.doordash,
          ubereats: income.ubereats > 0 ? income.ubereats : Number(existing.ubereats || 0),
          didi: income.didi > 0 ? income.didi : Number(existing.didi || 0),
          coles: income.coles > 0 ? income.coles : Number(existing.coles || 0)
        };

        const { error } = await supabase
          .from('incomes')
          .update(updatedIncome)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new income
        const { error } = await supabase
          .from('incomes')
          .insert({
            user_id: user.id,
            date: income.date,
            doordash: income.doordash || 0,
            ubereats: income.ubereats || 0,
            didi: income.didi || 0,
            coles: income.coles || 0
          });

        if (error) throw error;
      }

      // Reload data
      await loadUserData();
      
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        title: "Error",
        description: "Failed to add income. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          date: expense.date,
          name: expense.name,
          amount: expense.amount
        });

      if (error) throw error;

      // Reload data
      await loadUserData();
      
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setIncomes(prev => prev.filter(income => income.id !== id));
      
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: "Failed to delete income. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive"
      });
    }
  };

  const setTaxRate = async (rate: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          tax_rate: rate
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setTaxRateState(rate);
      
    } catch (error) {
      console.error('Error updating tax rate:', error);
      toast({
        title: "Error", 
        description: "Failed to update tax rate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetData = async () => {
    if (!user) return;

    try {
      // Delete all user data
      await Promise.all([
        supabase.from('incomes').delete().eq('user_id', user.id),
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('user_settings').update({ tax_rate: 20 }).eq('user_id', user.id)
      ]);

      // Clear local state
      setIncomes([]);
      setExpenses([]);
      setTaxRateState(20);

      // Clear localStorage as well
      localStorage.removeItem('gigzen-incomes');
      localStorage.removeItem('gigzen-expenses');
      localStorage.removeItem('gigzen-taxrate');

      toast({
        title: "Data Reset",
        description: "All your data has been cleared."
      });
      
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      setTaxRate,
      addIncome,
      addExpense,
      deleteIncome,
      deleteExpense,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}