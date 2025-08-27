import React, { createContext, useContext, useState } from 'react';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [taxRate, setTaxRate] = useState(20);

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome = {
      ...income,
      id: Date.now().toString()
    };
    setIncomes(prev => [...prev, newIncome]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString()
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      setTaxRate,
      addIncome,
      addExpense
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