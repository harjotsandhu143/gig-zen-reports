import React, { createContext, useContext, useState, useEffect } from 'react';
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

const generateId = () => crypto.randomUUID();

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxRate, setTaxRateState] = useState(20);
  const [weeklyTarget, setWeeklyTargetState] = useState(0);
  const [loading, setLoading] = useState(true);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedIncomes = localStorage.getItem('gigzen-incomes');
      const savedExpenses = localStorage.getItem('gigzen-expenses');
      const savedTaxRate = localStorage.getItem('gigzen-taxrate');
      const savedWeeklyTarget = localStorage.getItem('gigzen-weeklytarget');

      if (savedIncomes) {
        const parsed = JSON.parse(savedIncomes);
        setIncomes(parsed.sort((a: Income, b: Income) => 
          toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
        ));
      }
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        setExpenses(parsed.sort((a: Expense, b: Expense) => 
          toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
        ));
      }
      if (savedTaxRate) setTaxRateState(parseFloat(savedTaxRate));
      if (savedWeeklyTarget) setWeeklyTargetState(parseFloat(savedWeeklyTarget));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gigzen-incomes', JSON.stringify(incomes));
    }
  }, [incomes, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gigzen-expenses', JSON.stringify(expenses));
    }
  }, [expenses, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gigzen-taxrate', taxRate.toString());
    }
  }, [taxRate, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gigzen-weeklytarget', weeklyTarget.toString());
    }
  }, [weeklyTarget, loading]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    // Check if income already exists for this date
    const existing = incomes.find(i => i.date === income.date);

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
        ...existing,
        doordash: existing.doordash + income.doordash, // DoorDash: Add to previous
        ubereats: income.ubereats > 0 ? income.ubereats : existing.ubereats,
        didi: income.didi > 0 ? income.didi : existing.didi,
        coles: income.coles > 0 ? income.coles : existing.coles,
        tips: existing.tips + income.tips // Tips: Add to previous
      };

      undoAction.data.updated = updated;

      setIncomes(prev => prev.map(item => 
        item.id === existing.id ? updated : item
      ));
    } else {
      const newIncome = { ...income, id: generateId() };
      
      // Store undo action
      undoAction = {
        type: 'ADD_INCOME',
        data: newIncome,
        timestamp: Date.now()
      };

      setIncomes(prev => [newIncome, ...prev].sort((a, b) => 
        toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
      ));
    }

    // Add to undo stack (keep only last 10 actions)
    setUndoStack(prev => [undoAction, ...prev.slice(0, 9)]);

    toast({
      title: "Income added",
      description: "Your income has been saved successfully."
    });
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: generateId() };

    // Store undo action
    const undoAction: UndoAction = {
      type: 'ADD_EXPENSE',
      data: newExpense,
      timestamp: Date.now()
    };

    setExpenses(prev => [newExpense, ...prev].sort((a, b) => 
      toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()
    ));
    
    // Add to undo stack
    setUndoStack(prev => [undoAction, ...prev.slice(0, 9)]);

    toast({
      title: "Expense added",
      description: "Your expense has been saved successfully."
    });
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(income => income.id !== id));
    toast({
      title: "Income deleted",
      description: "The income record has been removed."
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense deleted",
      description: "The expense record has been removed."
    });
  };

  const resetData = () => {
    setIncomes([]);
    setExpenses([]);
    setTaxRateState(20);
    setWeeklyTargetState(0);
    localStorage.removeItem('gigzen-incomes');
    localStorage.removeItem('gigzen-expenses');
    localStorage.removeItem('gigzen-taxrate');
    localStorage.removeItem('gigzen-weeklytarget');

    toast({
      title: "Data reset",
      description: "All your data has been cleared."
    });
  };

  const updateIncome = (id: string, income: Omit<Income, 'id'>) => {
    setIncomes(prev => prev.map(item => 
      item.id === id ? { ...income, id } : item
    ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

    toast({
      title: "Income updated",
      description: "Your income has been updated successfully."
    });
  };

  const updateExpense = (id: string, expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => prev.map(item => 
      item.id === id ? { ...expense, id } : item
    ).sort((a, b) => toAustraliaTime(b.date).getTime() - toAustraliaTime(a.date).getTime()));

    toast({
      title: "Expense updated",
      description: "Your expense has been updated successfully."
    });
  };

  const setTaxRate = (rate: number) => {
    setTaxRateState(rate);
  };

  const setWeeklyTarget = (target: number) => {
    setWeeklyTargetState(target);
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[0];
    
    switch (lastAction.type) {
      case 'ADD_INCOME':
        setIncomes(prev => prev.filter(item => item.id !== lastAction.data.id));
        break;
        
      case 'ADD_EXPENSE':
        setExpenses(prev => prev.filter(item => item.id !== lastAction.data.id));
        break;
        
      case 'UPDATE_INCOME':
        setIncomes(prev => prev.map(item => 
          item.id === lastAction.data.id ? lastAction.data.previous : item
        ));
        break;
    }

    // Remove action from undo stack
    setUndoStack(prev => prev.slice(1));

    toast({
      title: "Action undone",
      description: "Your last action has been reversed."
    });
  };

  const canUndo = undoStack.length > 0;

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      weeklyTarget,
      loading,
      canUndo,
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
