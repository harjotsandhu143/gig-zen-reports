import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAustraliaDate, toAustraliaTime, getAustraliaWeekBounds } from '@/utils/timezone';
import { calculateWeeklyTax } from '@/utils/taxCalculator';

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

export const generateFinancialReport = (
  incomes: Income[],
  expenses: Expense[],
  taxRate: number
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80);
  doc.text('Income Tracker Report', 20, 25);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text(`Generated on: ${formatAustraliaDate(new Date(), 'MMMM dd, yyyy')}`, 20, 35);
  
  let yPosition = 50;
  
  // Calculate totals by income source
  const doordashIncome = incomes.reduce((sum, income) => sum + income.doordash, 0);
  const ubereatsIncome = incomes.reduce((sum, income) => sum + income.ubereats, 0);
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  const tipsIncome = incomes.reduce((sum, income) => sum + income.tips, 0);
  const colesGrossIncome = incomes.reduce((sum, income) => sum + income.coles, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate total Coles tax across all entries
  let totalColesTax = 0;
  incomes.forEach(income => {
    if (income.coles > 0) {
      const { tax } = calculateWeeklyTax(income.coles);
      totalColesTax += tax;
    }
  });
  
  const colesNetIncome = colesGrossIncome - totalColesTax;
  const gigIncome = doordashIncome + ubereatsIncome + didiIncome + tipsIncome;
  const totalIncome = colesNetIncome + gigIncome;
  
  // Calculate tax on gig income only (excluding Coles employment income)
  const taxableIncome = Math.max(0, gigIncome - totalExpenses);
  const taxAmount = (taxableIncome * taxRate) / 100;
  const didiGstAmount = (didiIncome - totalExpenses) * 0.1;
  const netIncome = totalIncome - totalExpenses - taxAmount;
  
  // Calculate weekly Coles tax for current week
  const currentWeekBounds = getAustraliaWeekBounds(new Date());
  const weeklyColesIncome = incomes
    .filter(income => {
      const incomeDate = toAustraliaTime(income.date);
      return incomeDate >= currentWeekBounds.start && incomeDate <= currentWeekBounds.end;
    })
    .reduce((sum, income) => sum + income.coles, 0);
  
  const { tax: weeklyTax, netPay: weeklyNetPay } = calculateWeeklyTax(weeklyColesIncome);
  const hasAnyColes = incomes.some(income => income.coles > 0);
  
  // Coles Weekly Tax Summary section (if applicable)
  if (hasAnyColes && weeklyColesIncome > 0) {
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text('Coles Weekly Tax Summary (ATO Scale 2)', 20, yPosition);
    yPosition += 5;
    
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    const weekRange = `${formatAustraliaDate(currentWeekBounds.start, 'MMM dd')} - ${formatAustraliaDate(currentWeekBounds.end, 'MMM dd, yyyy')}`;
    doc.text(`Week: ${weekRange}`, 20, yPosition);
    yPosition += 8;
    
    const colesTaxData = [
      ['Gross Amount', `$${weeklyColesIncome.toFixed(2)}`],
      ['Tax Deducted', `$${weeklyTax.toFixed(2)}`],
      ['Net Pay', `$${weeklyNetPay.toFixed(2)}`]
    ];
    
    autoTable(doc, {
      head: [['Category', 'Amount']],
      body: colesTaxData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [155, 89, 182], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 11 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text('Tax calculated using ATO Weekly Tax Table (Resident with Tax-Free Threshold)', 20, yPosition);
    yPosition += 15;
  }
  
  // Income Breakdown section
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text('Income Breakdown', 20, yPosition);
  yPosition += 10;
  
  const incomeBreakdownData = [
    ['DoorDash', `$${doordashIncome.toFixed(2)}`],
    ['UberEats', `$${ubereatsIncome.toFixed(2)}`],
    ['DiDi', `$${didiIncome.toFixed(2)}`],
    ['Tips', `$${tipsIncome.toFixed(2)}`],
    ['Coles (Gross)', `$${colesGrossIncome.toFixed(2)}`],
    ['Coles Tax Withheld', `-$${totalColesTax.toFixed(2)}`],
    ['Coles (Net)', `$${colesNetIncome.toFixed(2)}`],
    ['Total Income (After Tax)', `$${totalIncome.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    head: [['Source', 'Amount']],
    body: incomeBreakdownData,
    startY: yPosition,
    theme: 'striped',
    headStyles: { fillColor: [46, 204, 113], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 11 }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Key Statistics section
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text('Key Statistics', 20, yPosition);
  yPosition += 10;
  
  const statsData = [
    ['Total Income (After Coles Tax)', `$${totalIncome.toFixed(2)}`],
    ['Total Expenses', `$${totalExpenses.toFixed(2)}`],
    ['Gig Income Tax (' + taxRate + '%)', `$${taxAmount.toFixed(2)}`],
    ['DiDi GST Amount (10%)', `$${didiGstAmount.toFixed(2)}`],
    ['Net Income', `$${netIncome.toFixed(2)}`]
  ];
  
  autoTable(doc, {
    head: [['Category', 'Amount']],
    body: statsData,
    startY: yPosition,
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 11 }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Income section
  if (incomes.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Income Details', 20, yPosition);
    yPosition += 10;
    
    const incomeData = incomes.map(income => [
      formatAustraliaDate(income.date, 'MMM dd, yyyy'),
      `$${income.doordash.toFixed(2)}`,
      `$${income.ubereats.toFixed(2)}`,
      `$${income.didi.toFixed(2)}`,
      `$${income.coles.toFixed(2)}`,
      `$${income.tips.toFixed(2)}`,
      `$${(income.doordash + income.ubereats + income.didi + income.coles + income.tips).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Date', 'DoorDash', 'UberEats', 'DiDi', 'Coles', 'Tips', 'Total']],
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
      formatAustraliaDate(expense.date, 'MMM dd, yyyy'),
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
  const fileName = `financial-report-${formatAustraliaDate(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};