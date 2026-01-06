import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAustraliaDate } from '@/utils/timezone';

interface Income {
  id: string;
  date: string;
  doordash: number;
  ubereats: number;
  didi: number;
  coles: number;
  colesHours: number | null;
  tips: number;
  sourceName?: string | null;
  incomeType?: string;
}

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
}

export const generateFinancialReport = (
  incomes: Income[],
  expenses: Expense[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const warningColor: [number, number, number] = [249, 115, 22]; // Orange
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // ============ PAGE 1: SUMMARY ============
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('Gig Zen Report', 20, 27);
  
  // Subtitle with date range
  doc.setFontSize(11);
  const sortedIncomes = [...incomes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let dateRange = formatAustraliaDate(new Date(), 'MMMM yyyy');
  if (sortedIncomes.length > 0 || sortedExpenses.length > 0) {
    const allDates = [...sortedIncomes.map(i => i.date), ...sortedExpenses.map(e => e.date)].sort();
    if (allDates.length > 0) {
      const startDate = formatAustraliaDate(allDates[0], 'MMM d, yyyy');
      const endDate = formatAustraliaDate(allDates[allDates.length - 1], 'MMM d, yyyy');
      dateRange = startDate === endDate ? startDate : `${startDate} — ${endDate}`;
    }
  }
  doc.text(`Report Period: ${dateRange}`, 20, 35);
  
  let yPosition = 55;

  // Calculate all values
  const doordashIncome = incomes.reduce((sum, income) => sum + income.doordash, 0);
  const ubereatsIncome = incomes.reduce((sum, income) => sum + income.ubereats, 0);
  const didiIncome = incomes.reduce((sum, income) => sum + income.didi, 0);
  const tipsIncome = incomes.reduce((sum, income) => sum + income.tips, 0);
  const colesGrossIncome = incomes.reduce((sum, income) => sum + income.coles, 0);
  const totalColesHours = incomes.reduce((sum, income) => sum + (income.colesHours || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Total income
  const gigIncome = doordashIncome + ubereatsIncome + didiIncome + tipsIncome;
  const totalGrossIncome = colesGrossIncome + gigIncome;
  
  // Net Balance = Total Income - Expenses (simple, no tax estimation)
  const netBalance = totalGrossIncome - totalExpenses;

  // ============ SUMMARY SECTION ============
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text('Summary', 20, yPosition);
  yPosition += 10;

  // Summary table (simplified - no tax)
  const summaryData = [
    ['Total Income (Gross)', `$${totalGrossIncome.toFixed(2)}`],
    ['Total Expenses', `$${totalExpenses.toFixed(2)}`],
    ['Net Balance', `$${netBalance.toFixed(2)}`],
  ];

  autoTable(doc, {
    body: summaryData,
    startY: yPosition,
    theme: 'plain',
    styles: { 
      fontSize: 14,
      cellPadding: { top: 8, right: 12, bottom: 8, left: 12 },
    },
    columnStyles: {
      0: { fontStyle: 'normal', textColor: mutedColor, cellWidth: 120 },
      1: { fontStyle: 'bold', textColor: textColor, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      // Highlight net balance row
      if (data.row.index === 2) {
        data.cell.styles.textColor = successColor;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // ============ INCOME BREAKDOWN SECTION ============
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text('Income Breakdown', 20, yPosition);
  yPosition += 10;

  const incomeBreakdownData: string[][] = [];
  if (doordashIncome > 0) incomeBreakdownData.push(['DoorDash', `$${doordashIncome.toFixed(2)}`]);
  if (ubereatsIncome > 0) incomeBreakdownData.push(['Uber Eats', `$${ubereatsIncome.toFixed(2)}`]);
  if (didiIncome > 0) incomeBreakdownData.push(['DiDi', `$${didiIncome.toFixed(2)}`]);
  if (tipsIncome > 0) incomeBreakdownData.push(['Other Income', `$${tipsIncome.toFixed(2)}`]);
  if (colesGrossIncome > 0) {
    incomeBreakdownData.push(['Coles', `$${colesGrossIncome.toFixed(2)}`]);
    if (totalColesHours > 0) incomeBreakdownData.push(['Coles Hours Worked', `${totalColesHours.toFixed(1)} hrs`]);
  }
  incomeBreakdownData.push(['', '']);
  incomeBreakdownData.push(['Total Income', `$${totalGrossIncome.toFixed(2)}`]);

  autoTable(doc, {
    body: incomeBreakdownData,
    startY: yPosition,
    theme: 'plain',
    styles: { 
      fontSize: 11,
      cellPadding: { top: 5, right: 12, bottom: 5, left: 12 },
    },
    columnStyles: {
      0: { textColor: mutedColor, cellWidth: 100 },
      1: { textColor: textColor, halign: 'right', fontStyle: 'normal' },
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      if (data.row.index === incomeBreakdownData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = successColor;
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Disclaimer
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Net balance shows income after expenses. Final tax is calculated by your tax agent or the ATO.', 20, yPosition);

  // ============ PAGE 2+: DETAILED TABLES ============
  
  // Income Details
  if (incomes.length > 0) {
    doc.addPage();
    yPosition = 25;
    
    doc.setFontSize(18);
    doc.setTextColor(...textColor);
    doc.text('Income Details', 20, yPosition);
    yPosition += 10;

    const incomeData = incomes.map(income => {
      const total = income.doordash + income.ubereats + income.didi + income.coles + income.tips;
      // Determine source name - show "Unknown" if no source specified
      let source = '';
      if (income.sourceName) {
        source = income.sourceName;
      } else if (income.doordash > 0) {
        source = 'DoorDash';
      } else if (income.ubereats > 0) {
        source = 'Uber Eats';
      } else if (income.didi > 0) {
        source = 'DiDi';
      } else if (income.coles > 0) {
        source = 'Coles';
      } else if (income.tips > 0) {
        source = 'Other';
      } else {
        source = 'Unknown';
      }
      
      return [
        formatAustraliaDate(income.date, 'MMM dd, yyyy'),
        source,
        `$${total.toFixed(2)}`
      ];
    });

    // Add totals row
    incomeData.push(['', 'Total', `$${totalGrossIncome.toFixed(2)}`]);

    autoTable(doc, {
      head: [['Date', 'Source', 'Amount']],
      body: incomeData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { 
        fillColor: successColor, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 6
      },
      bodyStyles: { 
        cellPadding: 5,
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 80 },
        2: { halign: 'right', cellWidth: 45 }
      },
      margin: { left: 20, right: 20 },
      didParseCell: function(data) {
        // Style totals row
        if (data.row.index === incomeData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 253, 244];
        }
      }
    });
  }

  // Expense Details
  if (expenses.length > 0) {
    const currentY = incomes.length > 0 ? (doc as any).lastAutoTable.finalY + 25 : 25;
    
    // Check if we need a new page
    if (currentY > 220) {
      doc.addPage();
      yPosition = 25;
    } else {
      yPosition = currentY;
    }

    doc.setFontSize(18);
    doc.setTextColor(...textColor);
    doc.text('Expense Details', 20, yPosition);
    yPosition += 10;

    const expenseData = expenses.map(expense => [
      formatAustraliaDate(expense.date, 'MMM dd, yyyy'),
      expense.name,
      `$${expense.amount.toFixed(2)}`
    ]);

    // Add totals row
    expenseData.push(['', 'Total', `$${totalExpenses.toFixed(2)}`]);

    autoTable(doc, {
      head: [['Date', 'Category', 'Amount']],
      body: expenseData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { 
        fillColor: warningColor, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 6
      },
      bodyStyles: { 
        cellPadding: 5,
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 90 },
        2: { halign: 'right', cellWidth: 40 }
      },
      margin: { left: 20, right: 20 },
      didParseCell: function(data) {
        // Style totals row
        if (data.row.index === expenseData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
        }
      }
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Generated on ${formatAustraliaDate(new Date(), 'MMMM dd, yyyy')} • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `gig-zen-report-${formatAustraliaDate(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};
