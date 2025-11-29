/**
 * Calculate weekly tax based on ATO Weekly Tax Table
 * (Resident with Tax-Free Threshold - Scale 2)
 * 
 * @param grossAmount - The weekly gross income amount
 * @returns Object containing tax and net pay
 */
export const calculateWeeklyTax = (grossAmount: number): { tax: number; netPay: number } => {
  // Floor the gross amount (ignore cents)
  const x = Math.floor(grossAmount);
  
  let tax = 0;
  
  // Apply tax brackets
  if (x < 361) {
    tax = 0;
  } else if (x >= 361 && x <= 499) {
    tax = (0.1600 * x) - 57.8462;
  } else if (x >= 500 && x <= 624) {
    tax = (0.2600 * x) - 107.8462;
  } else if (x >= 625 && x <= 720) {
    tax = (0.1800 * x) - 57.8462;
  } else if (x >= 721 && x <= 864) {
    tax = (0.1890 * x) - 64.3365;
  } else if (x >= 865 && x <= 1281) {
    tax = (0.3227 * x) - 180.0385;
  } else if (x >= 1282) {
    tax = (0.3200 * x) - 176.5769;
  }
  
  // Round to nearest dollar
  tax = Math.round(tax);
  
  // Calculate net pay
  const netPay = grossAmount - tax;
  
  return {
    tax,
    netPay
  };
};
