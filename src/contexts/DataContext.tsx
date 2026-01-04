import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toAustraliaTime } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Income {
  id: string;
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
  colesHours: number | null;
  tips: number;
  // New universal fields
  sourceName: string | null;
  incomeType: string;
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
  hasCompletedOnboarding: boolean;
  setTaxRate: (rate: number) => void;
  setWeeklyTarget: (target: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addUniversalIncome: (income: { date: string; amount: number; sourceName: string; incomeType: string }) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateIncome: (id: string, income: Omit<Income, 'id'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;
  resetData: () => void;
  undo: () => void;
  completeOnboarding: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxRate, setTaxRateState] = useState(20);
  const [weeklyTarget, setWeeklyTargetState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default true to avoid flash
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setIncomes([]);
      setExpenses([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load incomes (only non-archived)
        const { data: incomesData, error: incomesError } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('date', { ascending: false });

        if (incomesError) throw incomesError;

        const mappedIncomes: Income[] = (incomesData || []).map(inc => ({
          id: inc.id,
          date: inc.date,
          doordash: inc.doordash || 0,
          ubereats: inc.ubereats || 0,
          didi: inc.didi || 0,
          coles: inc.coles || 0,
          colesHours: inc.coles_hours ?? null,
          tips: inc.tips || 0,
          sourceName: (inc as any).source_name ?? null,
          incomeType: (inc as any).income_type ?? 'gig',
        }));
        setIncomes(mappedIncomes);

        // Load expenses (only non-archived)
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;

        const mappedExpenses: Expense[] = (expensesData || []).map(exp => ({
          id: exp.id,
          date: exp.date,
          name: exp.name,
          amount: exp.amount
        }));
        setExpenses(mappedExpenses);

        // Load user settings
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsData) {
          setTaxRateState(settingsData.tax_rate || 20);
          setWeeklyTargetState(settingsData.weekly_target || 0);
          setHasCompletedOnboarding((settingsData as any).has_completed_onboarding ?? false);
        } else {
          // New user - show onboarding
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          has_completed_onboarding: true 
        }, { onConflict: 'user_id' });
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!user) return;

    // Check if income already exists for this date
    const existing = incomes.find(i => i.date === income.date);

    if (existing) {
      // Update existing record
      const updated = {
        doordash: existing.doordash + income.doordash,
        ubereats: income.ubereats > 0 ? income.ubereats : existing.ubereats,
        didi: income.didi > 0 ? income.didi : existing.didi,
        coles: income.coles > 0 ? income.coles : existing.coles,
        coles_hours: income.colesHours !== null ? income.colesHours : existing.colesHours,
        tips: existing.tips + income.tips
      };

      const { error } = await supabase
        .from('incomes')
        .update(updated)
        .eq('id', existing.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      setIncomes(prev => prev.map(item => 
        item.id === existing.id ? { 
          ...item, 
          ...updated,
          colesHours: updated.coles_hours ?? item.colesHours
        } : item
      ));
    } else {
      const { data, error } = await supabase
        .from('incomes')
        .insert({
          user_id: user.id,
          date: income.date,
          doordash: income.doordash,
          ubereats: income.ubereats,
          didi: income.didi,
          coles: income.coles,
          coles_hours: income.colesHours,
          tips: income.tips,
          source_name: income.sourceName,
          income_type: income.incomeType
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      const newIncome: Income = {
        id: data.id,
        date: data.date,
        doordash: data.doordash || 0,
        ubereats: data.ubereats || 0,
        didi: data.didi || 0,
        coles: data.coles || 0,
        colesHours: data.coles_hours ?? null,
        tips: data.tips || 0,
        sourceName: (data as any).source_name ?? null,
        incomeType: (data as any).income_type ?? 'gig',
      };

      setIncomes(prev => [newIncome, ...prev].sort((a, b) => 
        toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
      ));
    }

    toast({ title: "Income added", description: "Your income has been saved successfully." });
  };

  // New universal income add function
  const addUniversalIncome = async (income: { date: string; amount: number; sourceName: string; incomeType: string }) => {
    if (!user) return;

    // Map common source names to legacy columns for backward compatibility
    const legacyMapping: Record<string, string> = {
      'Uber Eats': 'ubereats',
      'DoorDash': 'doordash',
      'DiDi': 'didi',
      'Coles': 'coles',
    };

    const legacyColumn = legacyMapping[income.sourceName];

    if (legacyColumn) {
      // Use legacy system for known gig platforms
      const legacyIncome: Omit<Income, 'id'> = {
        date: income.date,
        doordash: legacyColumn === 'doordash' ? income.amount : 0,
        ubereats: legacyColumn === 'ubereats' ? income.amount : 0,
        didi: legacyColumn === 'didi' ? income.amount : 0,
        coles: legacyColumn === 'coles' ? income.amount : 0,
        colesHours: null,
        tips: 0,
        sourceName: income.sourceName,
        incomeType: income.incomeType,
      };
      await addIncome(legacyIncome);
    } else {
      // Use new universal income system
      const { data, error } = await supabase
        .from('incomes')
        .insert({
          user_id: user.id,
          date: income.date,
          doordash: 0,
          ubereats: 0,
          didi: 0,
          coles: 0,
          tips: 0,
          source_name: income.sourceName,
          income_type: income.incomeType,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      // For universal income, we store the amount differently
      // Since we don't have a dedicated 'amount' column, we'll use tips as a general-purpose field
      // OR we need to update the record with the source amount
      // For now, let's use tips as a catch-all for non-legacy income
      const { error: updateError } = await supabase
        .from('incomes')
        .update({ tips: income.amount })
        .eq('id', data.id);

      if (updateError) {
        toast({ title: "Error", description: updateError.message, variant: "destructive" });
        return;
      }

      const newIncome: Income = {
        id: data.id,
        date: data.date,
        doordash: 0,
        ubereats: 0,
        didi: 0,
        coles: 0,
        colesHours: null,
        tips: income.amount, // Store universal amount in tips for now
        sourceName: income.sourceName,
        incomeType: income.incomeType,
      };

      setIncomes(prev => [newIncome, ...prev].sort((a, b) => 
        toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
      ));

      toast({ title: "Income added", description: "Your income has been saved successfully." });
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

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

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    const newExpense: Expense = {
      id: data.id,
      date: data.date,
      name: data.name,
      amount: data.amount
    };

    setExpenses(prev => [newExpense, ...prev].sort((a, b) => 
      toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
    ));

    toast({ title: "Expense added", description: "Your expense has been saved successfully." });
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from('incomes').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setIncomes(prev => prev.filter(income => income.id !== id));
    toast({ title: "Income deleted", description: "The income record has been removed." });
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({ title: "Expense deleted", description: "The expense record has been removed." });
  };

  const updateIncome = async (id: string, income: Omit<Income, 'id'>) => {
    const { error } = await supabase
      .from('incomes')
      .update({
        date: income.date,
        doordash: income.doordash,
        ubereats: income.ubereats,
        didi: income.didi,
        coles: income.coles,
        coles_hours: income.colesHours,
        tips: income.tips,
        source_name: income.sourceName,
        income_type: income.incomeType,
      })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setIncomes(prev => prev.map(item => 
      item.id === id ? { ...income, id } : item
    ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

    toast({ title: "Income updated", description: "Your income has been updated successfully." });
  };

  const updateExpense = async (id: string, expense: Omit<Expense, 'id'>) => {
    const { error } = await supabase
      .from('expenses')
      .update({
        date: expense.date,
        name: expense.name,
        amount: expense.amount
      })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setExpenses(prev => prev.map(item => 
      item.id === id ? { ...expense, id } : item
    ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

    toast({ title: "Expense updated", description: "Your expense has been updated successfully." });
  };

  const setTaxRate = async (rate: number) => {
    setTaxRateState(rate);
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, tax_rate: rate }, { onConflict: 'user_id' });
    }
  };

  const setWeeklyTarget = async (target: number) => {
    setWeeklyTargetState(target);
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, weekly_target: target }, { onConflict: 'user_id' });
    }
  };

  const resetData = async () => {
    if (!user) return;
    
    // Archive all current income and expense records instead of deleting
    await supabase
      .from('incomes')
      .update({ archived: true })
      .eq('user_id', user.id)
      .eq('archived', false);
      
    await supabase
      .from('expenses')
      .update({ archived: true })
      .eq('user_id', user.id)
      .eq('archived', false);
    
    setIncomes([]);
    setExpenses([]);
    setWeeklyTargetState(0);
    
    // Reset weekly target in database
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, weekly_target: 0 }, { onConflict: 'user_id' });

    toast({ title: "Week reset", description: "Your data has been archived. Starting fresh!" });
  };

  const undo = () => {
    toast({ title: "Undo not available", description: "Undo is not supported with cloud storage." });
  };

  const canUndo = false;

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      weeklyTarget,
      loading,
      canUndo,
      hasCompletedOnboarding,
      setTaxRate,
      setWeeklyTarget,
      addIncome,
      addUniversalIncome,
      addExpense,
      updateIncome,
      updateExpense,
      deleteIncome,
      deleteExpense,
      resetData,
      undo,
      completeOnboarding
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
