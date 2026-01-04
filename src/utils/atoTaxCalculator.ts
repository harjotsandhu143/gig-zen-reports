/**
 * ATO-based Tax Estimation for Australian residents
 * 
 * Income Types:
 * - salary: Uses progressive tax brackets (annualized estimate)
 * - casual: Uses progressive tax brackets (annualized estimate)  
 * - abn: Uses configurable set-aside percentage (conservative)
 * - freelance: Uses configurable set-aside percentage (conservative)
 * - gig: Uses configurable set-aside percentage (conservative)
 * - other: Uses configurable set-aside percentage
 */

// 2024-2025 Australian Tax Brackets (Resident)
// Source: ATO - Tax rates – resident
const TAX_BRACKETS_2025 = [
  { min: 0, max: 18200, rate: 0, base: 0 },
  { min: 18201, max: 45000, rate: 0.16, base: 0 },
  { min: 45001, max: 135000, rate: 0.30, base: 4288 },
  { min: 135001, max: 190000, rate: 0.37, base: 31288 },
  { min: 190001, max: Infinity, rate: 0.45, base: 51638 },
];

// Medicare levy rate
const MEDICARE_LEVY_RATE = 0.02;

/**
 * Calculate estimated annual tax for salary/wages using ATO brackets
 */
export function calculateProgressiveTax(annualIncome: number): { 
  incomeTax: number; 
  medicareLevy: number; 
  totalTax: number;
  effectiveRate: number;
} {
  if (annualIncome <= 0) {
    return { incomeTax: 0, medicareLevy: 0, totalTax: 0, effectiveRate: 0 };
  }

  // Find applicable bracket
  let incomeTax = 0;
  for (const bracket of TAX_BRACKETS_2025) {
    if (annualIncome >= bracket.min) {
      if (annualIncome <= bracket.max) {
        incomeTax = bracket.base + (annualIncome - bracket.min + 1) * bracket.rate;
        break;
      }
    }
  }

  // Medicare levy (simplified - full rate above threshold)
  const medicareLevy = annualIncome > 26000 ? annualIncome * MEDICARE_LEVY_RATE : 0;
  
  const totalTax = incomeTax + medicareLevy;
  const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return {
    incomeTax: Math.round(incomeTax * 100) / 100,
    medicareLevy: Math.round(medicareLevy * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10) / 10,
  };
}

/**
 * Estimate tax to set aside based on income type
 */
export function estimateTaxToSetAside(
  amount: number, 
  incomeType: string,
  selfEmployedRate: number = 25 // Default conservative rate for ABN/freelance
): number {
  if (amount <= 0) return 0;

  switch (incomeType) {
    case 'salary':
    case 'casual':
      // For employment income, estimate based on annualized brackets
      // This is just an estimate - actual tax is withheld by employer
      const annualized = amount * 52; // Rough weekly to annual
      const { effectiveRate } = calculateProgressiveTax(annualized);
      return Math.round((amount * effectiveRate / 100) * 100) / 100;

    case 'abn':
    case 'freelance':
    case 'gig':
      // For self-employed income, use conservative set-aside rate
      // Includes GST consideration for ABN holders
      return Math.round((amount * selfEmployedRate / 100) * 100) / 100;

    case 'other':
    default:
      // Default to a moderate set-aside rate
      return Math.round((amount * 20 / 100) * 100) / 100;
  }
}

/**
 * Calculate total estimated tax across all income entries
 */
export function calculateTotalTaxEstimate(
  incomes: Array<{ amount: number; incomeType: string }>,
  selfEmployedRate: number = 25
): {
  salaryWagesTax: number;
  selfEmployedTax: number;
  totalTax: number;
} {
  let salaryWagesTax = 0;
  let selfEmployedTax = 0;

  for (const income of incomes) {
    const tax = estimateTaxToSetAside(income.amount, income.incomeType, selfEmployedRate);
    
    if (income.incomeType === 'salary' || income.incomeType === 'casual') {
      salaryWagesTax += tax;
    } else {
      selfEmployedTax += tax;
    }
  }

  return {
    salaryWagesTax: Math.round(salaryWagesTax * 100) / 100,
    selfEmployedTax: Math.round(selfEmployedTax * 100) / 100,
    totalTax: Math.round((salaryWagesTax + selfEmployedTax) * 100) / 100,
  };
}

/**
 * Format income type for display
 */
export function formatIncomeType(type: string): string {
  const labels: Record<string, string> = {
    salary: 'Salary/Wages',
    casual: 'Casual Work',
    abn: 'ABN/Contract',
    freelance: 'Freelance',
    gig: 'Gig Work',
    other: 'Other',
  };
  return labels[type] || 'Other';
}

export const INCOME_TYPES = [
  { value: 'salary', label: 'Salary/Wages' },
  { value: 'casual', label: 'Casual Work' },
  { value: 'abn', label: 'ABN/Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'gig', label: 'Gig Work' },
  { value: 'other', label: 'Other' },
];
