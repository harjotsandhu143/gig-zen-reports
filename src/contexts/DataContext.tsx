import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toAustraliaTime } from '@/utils/timezone';

interface Income {
  id: string;
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
  tips: number;
}

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
}

interface UndoAction {
  type: 'ADD_INCOME' | 'ADD_EXPENSE' | 'UPDATE_INCOME' | 'DELETE_INCOME' | 'DELETE_EXPENSE';
  data: any;
  timestamp: number;
}

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  taxRate: number;
  weeklyTarget: number;
  loading: boolean;
  canUndo: boolean;
  setTaxRate: (rate: number) => void;
  setWeeklyTarget: (target: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateIncome: (id: string, income: Omit<Income, 'id'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;
  resetData: () => void;
  undo: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxRate, setTaxRateState] = useState(20);
  const [weeklyTarget, setWeeklyTargetState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [dataCache, setDataCache] = useState<{
    incomes: Income[];
    expenses: Expense[];
    timestamp: number;
  } | null>(null);

  // Migrate localStorage data to Supabase on first auth
  const migrateLocalStorageData = async () => {
    if (!user || migrated) return;
    
    try {
      const savedIncomes = localStorage.getItem('gigzen-incomes');
      const savedExpenses = localStorage.getItem('gigzen-expenses');
      const savedTaxRate = localStorage.getItem('gigzen-taxrate');

      if (savedIncomes) {
        const localIncomes = JSON.parse(savedIncomes);
        for (const income of localIncomes) {
          await supabase.from('incomes').insert({
            user_id: user.id,
            date: income.date,
            doordash: income.doordash,
            ubereats: income.ubereats,
            didi: income.didi,
            coles: income.coles,
            tips: income.tips || 0
          });
        }
        localStorage.removeItem('gigzen-incomes');
      }

      if (savedExpenses) {
        const localExpenses = JSON.parse(savedExpenses);
        for (const expense of localExpenses) {
          await supabase.from('expenses').insert({
            user_id: user.id,
            date: expense.date,
            name: expense.name,
            amount: expense.amount
          });
        }
        localStorage.removeItem('gigzen-expenses');
      }

      if (savedTaxRate) {
        await supabase.from('user_settings')
          .upsert({
            user_id: user.id,
            tax_rate: parseFloat(savedTaxRate)
          }, {
            onConflict: 'user_id'
          });
        localStorage.removeItem('gigzen-taxrate');
      }

      setMigrated(true);
      if (savedIncomes || savedExpenses || savedTaxRate) {
        toast({
          title: "Data migrated",
          description: "Your local data has been synced to the cloud!"
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  };

  // Load data from Supabase with caching
  const loadData = async (forceRefresh = false) => {
    if (!user) return;
    
    // Check cache first (5 minute cache)
    const now = Date.now();
    if (!forceRefresh && dataCache && (now - dataCache.timestamp) < 300000) {
      setIncomes(dataCache.incomes);
      setExpenses(dataCache.expenses);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Use parallel queries for faster loading
      const [incomesResponse, expensesResponse, settingsResponse] = await Promise.all([
        supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const sortedIncomes = incomesResponse.data || [];
      const sortedExpenses = expensesResponse.data || [];
      
      setIncomes(sortedIncomes);
      setExpenses(sortedExpenses);
      setTaxRateState(settingsResponse.data?.tax_rate || 20);
      setWeeklyTargetState(settingsResponse.data?.weekly_target || 0);
      
      // Update cache
      setDataCache({
        incomes: sortedIncomes,
        expenses: sortedExpenses,
        timestamp: now
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Failed to load data",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!user) return;

    try {
      // Apply 6% tax deduction to Coles income
      const colesAfterTax = income.coles * 0.94;

      // Check if income already exists for this date
      const { data: existing } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', income.date)
        .maybeSingle();

      let undoAction: UndoAction;

      if (existing) {
        // Store previous state for undo
        undoAction = {
          type: 'UPDATE_INCOME',
          data: { id: existing.id, previous: { ...existing }, updated: null },
          timestamp: Date.now()
        };

        // Update existing record with different behavior per platform
        const updated = {
          doordash: existing.doordash + income.doordash, // DoorDash: Add to previous
          ubereats: income.ubereats > 0 ? income.ubereats : existing.ubereats,
          didi: income.didi > 0 ? income.didi : existing.didi,
          coles: income.coles > 0 ? colesAfterTax : existing.coles, // Coles: Apply 6% tax deduction
          tips: existing.tips + income.tips // Tips: Add to previous
        };

        undoAction.data.updated = { ...existing, ...updated };

        const { error } = await supabase
          .from('incomes')
          .update(updated)
          .eq('id', existing.id);

        if (error) throw error;

        // Update local state
        setIncomes(prev => prev.map(item => 
          item.id === existing.id ? { ...item, ...updated } : item
        ));
      } else {
        // Create new income record
        const { data, error } = await supabase
          .from('incomes')
          .insert({
            user_id: user.id,
            date: income.date,
            doordash: income.doordash,
            ubereats: income.ubereats,
            didi: income.didi,
            coles: colesAfterTax, // Apply 6% tax deduction
            tips: income.tips
          })
          .select()
          .single();

        if (error) throw error;

        // Store undo action
        undoAction = {
          type: 'ADD_INCOME',
          data: { ...data },
          timestamp: Date.now()
        };

        setIncomes(prev => [data, ...prev].sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));
      }

      // Add to undo stack (keep only last 10 actions)
      setUndoStack(prev => [undoAction, ...prev.slice(0, 9)]);

      toast({
        title: "Income added",
        description: "Your income has been saved successfully."
      });
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        title: "Failed to add income",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          date: expense.date,
          name: expense.name,
          amount: expense.amount
        })
        .select()
        .single();

      if (error) throw error;

      // Store undo action
      const undoAction: UndoAction = {
        type: 'ADD_EXPENSE',
        data: { ...data },
        timestamp: Date.now()
      };

      setExpenses(prev => [data, ...prev].sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));
      
      // Add to undo stack (keep only last 10 actions)
      setUndoStack(prev => [undoAction, ...prev.slice(0, 9)]);

      toast({
        title: "Expense added",
        description: "Your expense has been saved successfully."
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Failed to add expense",
        description: "Please try again.",
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
        .eq('id', id);

      if (error) throw error;

      setIncomes(prev => prev.filter(income => income.id !== id));
      toast({
        title: "Income deleted",
        description: "The income record has been removed."
      });
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: "Failed to delete income",
        description: "Please try again.",
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
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast({
        title: "Expense deleted",
        description: "The expense record has been removed."
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Failed to delete expense",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetData = async () => {
    if (!user) return;

    try {
      // Delete all user data from Supabase
      await supabase.from('incomes').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('user_settings')
        .upsert({
          user_id: user.id,
          tax_rate: 20
        }, {
          onConflict: 'user_id'
        });

      setIncomes([]);
      setExpenses([]);
      setTaxRateState(20);

      toast({
        title: "Data reset",
        description: "All your data has been cleared."
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Failed to reset data",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateIncome = async (id: string, income: Omit<Income, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('incomes')
        .update({
          date: income.date,
          doordash: income.doordash,
          ubereats: income.ubereats,
          didi: income.didi,
          coles: income.coles,
          tips: income.tips
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state and maintain sort order
      setIncomes(prev => prev.map(item => 
        item.id === id ? { ...income, id } : item
      ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

      // Clear cache to force refresh
      setDataCache(null);

      toast({
        title: "Income updated",
        description: "Your income has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating income:', error);
      toast({
        title: "Failed to update income",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateExpense = async (id: string, expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          date: expense.date,
          name: expense.name,
          amount: expense.amount
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state and maintain sort order
      setExpenses(prev => prev.map(item => 
        item.id === id ? { ...expense, id } : item
      ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

      // Clear cache to force refresh
      setDataCache(null);

      toast({
        title: "Expense updated",
        description: "Your expense has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Failed to update expense",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const undo = async () => {
    if (!user || undoStack.length === 0) return;

    const lastAction = undoStack[0];
    
    try {
      switch (lastAction.type) {
        case 'ADD_INCOME':
          // Delete the added income
          await supabase.from('incomes').delete().eq('id', lastAction.data.id);
          setIncomes(prev => prev.filter(item => item.id !== lastAction.data.id));
          break;
          
        case 'ADD_EXPENSE':
          // Delete the added expense
          await supabase.from('expenses').delete().eq('id', lastAction.data.id);
          setExpenses(prev => prev.filter(item => item.id !== lastAction.data.id));
          break;
          
        case 'UPDATE_INCOME':
          // Restore previous income state
          const { id, previous } = lastAction.data;
          await supabase.from('incomes').update({
            date: previous.date,
            doordash: previous.doordash,
            ubereats: previous.ubereats,
            didi: previous.didi,
            coles: previous.coles,
            tips: previous.tips
          }).eq('id', id);
          setIncomes(prev => prev.map(item => 
            item.id === id ? previous : item
          ));
          break;
      }

      // Remove the undone action from stack
      setUndoStack(prev => prev.slice(1));
      
      toast({
        title: "Action undone",
        description: "Previous action has been reversed."
      });
    } catch (error) {
      console.error('Error undoing action:', error);
      toast({
        title: "Failed to undo",
        description: "Please try again.",
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
        title: "Failed to update tax rate",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const setWeeklyTarget = async (target: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          weekly_target: target
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setWeeklyTargetState(target);
      toast({
        title: "Target updated",
        description: `Weekly target set to $${target.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error updating weekly target:', error);
      toast({
        title: "Failed to update target",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      migrateLocalStorageData().then(() => {
        loadData();
      });
    } else {
      setIncomes([]);
      setExpenses([]);
      setTaxRateState(20);
      setLoading(false);
    }
  }, [user]);

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      weeklyTarget,
      loading,
      canUndo: undoStack.length > 0,
      setTaxRate,
      setWeeklyTarget,
      addIncome,
      addExpense,
      updateIncome,
      updateExpense,
      deleteIncome,
      deleteExpense,
      resetData,
      undo
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