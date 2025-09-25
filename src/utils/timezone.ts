import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Australia/Sydney';

/**
 * Get current date in Australia/Sydney timezone
 */
export const getAustraliaDate = (): Date => {
  return toZonedTime(new Date(), TIMEZONE);
};

/**
 * Get current date formatted as YYYY-MM-DD in Australia timezone
 */
export const getAustraliaDateString = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Format date in Australia timezone
 */
export const formatAustraliaDate = (date: Date | string, formatStr: string = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, TIMEZONE, formatStr);
};

/**
 * Convert date to Australia timezone for calculations
 */
export const toAustraliaTime = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, TIMEZONE);
};

/**
 * Convert Australia timezone date to UTC for storage
 */
export const fromAustraliaTime = (date: Date): Date => {
  return fromZonedTime(date, TIMEZONE);
};

/**
 * Check if a date is today in Australia timezone
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const australiaDate = toZonedTime(dateObj, TIMEZONE);
  const today = getAustraliaDate();
  
  return formatInTimeZone(australiaDate, TIMEZONE, 'yyyy-MM-dd') === 
         formatInTimeZone(today, TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Get start and end of day in Australia timezone
 */
export const getAustraliaDayBounds = (date?: Date | string) => {
  const targetDate = date ? (typeof date === 'string' ? parseISO(date) : date) : new Date();
  const australiaDate = toZonedTime(targetDate, TIMEZONE);
  
  return {
    start: startOfDay(australiaDate),
    end: endOfDay(australiaDate)
  };
};

/**
 * Get start and end of week in Australia timezone
 */
export const getAustraliaWeekBounds = (date?: Date | string) => {
  const targetDate = date ? (typeof date === 'string' ? parseISO(date) : date) : new Date();
  const australiaDate = toZonedTime(targetDate, TIMEZONE);
  
  return {
    start: startOfWeek(australiaDate, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(australiaDate, { weekStartsOn: 1 })
  };
};

/**
 * Get start and end of month in Australia timezone
 */
export const getAustraliaMonthBounds = (date?: Date | string) => {
  const targetDate = date ? (typeof date === 'string' ? parseISO(date) : date) : new Date();
  const australiaDate = toZonedTime(targetDate, TIMEZONE);
  
  return {
    start: startOfMonth(australiaDate),
    end: endOfMonth(australiaDate)
  };
};

/**
 * Sort dates in Australia timezone (most recent first)
 */
export const sortDatesByAustraliaTime = (dates: string[]) => {
  return dates.sort((a, b) => {
    const dateA = toZonedTime(parseISO(a), TIMEZONE);
    const dateB = toZonedTime(parseISO(b), TIMEZONE);
    return dateB.getTime() - dateA.getTime();
  });
};