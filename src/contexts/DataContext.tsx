import React, { createContext, useContext, useState, useEffect } from 'react';

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
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem('gigzen-incomes');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('gigzen-expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [taxRate, setTaxRate] = useState(() => {
    const saved = localStorage.getItem('gigzen-taxrate');
    return saved ? parseFloat(saved) : 20;
  });

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

  const resetData = () => {
    setIncomes([]);
    setExpenses([]);
    setTaxRate(20);
    localStorage.removeItem('gigzen-incomes');
    localStorage.removeItem('gigzen-expenses');
    localStorage.removeItem('gigzen-taxrate');
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('gigzen-incomes', JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem('gigzen-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('gigzen-taxrate', taxRate.toString());
  }, [taxRate]);

  return (
    <DataContext.Provider value={{
      incomes,
      expenses,
      taxRate,
      setTaxRate,
      addIncome,
      addExpense,
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