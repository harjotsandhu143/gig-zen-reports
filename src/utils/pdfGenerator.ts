import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

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

export const generateFinancialReport = (
  incomes: Income[],
  expenses: Expense[],
  taxRate: number
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80);
  doc.text('Financial Report', 20, 25);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 35);
  
  let yPosition = 50;
  
  // Calculate totals
  const totalIncome = incomes.reduce((sum, income) => 
    sum + income.doordash + income.ubereats + income.didi + income.coles, 0
  );
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const estimatedTax = (netIncome * taxRate) / 100;
  const afterTaxIncome = netIncome - estimatedTax;
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(44, 62, 80);
  doc.text('Summary', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(52, 73, 94);
  const summaryData = [
    ['Total Income', `$${totalIncome.toFixed(2)}`],
    ['Total Expenses', `$${totalExpenses.toFixed(2)}`],
    ['Net Income', `$${netIncome.toFixed(2)}`],
    ['Estimated Tax (' + taxRate + '%)', `$${estimatedTax.toFixed(2)}`],
    ['After-Tax Income', `$${afterTaxIncome.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    head: [['Category', 'Amount']],
    body: summaryData,
    startY: yPosition,
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 20, right: 20 }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Income section
  if (incomes.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Income Details', 20, yPosition);
    yPosition += 10;
    
    const incomeData = incomes.map(income => [
      format(new Date(income.date), 'MMM dd, yyyy'),
      `$${income.doordash.toFixed(2)}`,
      `$${income.ubereats.toFixed(2)}`,
      `$${income.didi.toFixed(2)}`,
      `$${income.coles.toFixed(2)}`,
      `$${(income.doordash + income.ubereats + income.didi + income.coles).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Date', 'DoorDash', 'UberEats', 'DiDi', 'Coles', 'Total']],
      body: incomeData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Expenses section
  if (expenses.length > 0) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Expense Details', 20, yPosition);
    yPosition += 10;
    
    const expenseData = expenses.map(expense => [
      format(new Date(expense.date), 'MMM dd, yyyy'),
      expense.name,
      `$${expense.amount.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Description', 'Amount']],
      body: expenseData,
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20, right: 20 }
    });
  }
  
  // Save the PDF
  const fileName = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};