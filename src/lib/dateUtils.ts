import { format, parseISO, isValid } from 'date-fns';

/**
 * Standard date utilities for the application
 * 
 * STANDARD FORMAT: All dates should be stored as ISO date strings (YYYY-MM-DD)
 * in the database and passed between components.
 */

export type DateString = string; // ISO date string (YYYY-MM-DD)

/**
 * Converts various date input formats to standardized ISO date string (YYYY-MM-DD)
 */
export const standardizeDate = (input: string | Date | null | undefined): DateString | null => {
  if (!input) return null;
  
  if (input instanceof Date) {
    if (!isValid(input)) return null;
    return format(input, 'yyyy-MM-dd');
  }
  
  const dateStr = input.trim();
  if (!dateStr) return null;
  
  // Handle MM/YYYY format (e.g., "09/2007")
  const mmYyyy = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = mmYyyy[1].padStart(2, '0');
    const year = mmYyyy[2];
    return `${year}-${month}-01`;
  }
  
  // Handle YYYY-MM format (from month inputs)
  const yyyyMm = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMm) {
    return `${dateStr}-01`;
  }
  
  // Handle YYYY format
  const yearOnly = dateStr.match(/^(\d{4})$/);
  if (yearOnly) {
    return `${yearOnly[1]}-01-01`;
  }
  
  // Handle month name + year format (e.g., "January 2020", "Jan 2020")
  const monthYear = dateStr.match(/^(\w+)\s+(\d{4})$/);
  if (monthYear) {
    const month = monthYear[1];
    const year = monthYear[2];
    const monthNum = getMonthNumber(month);
    return `${year}-${monthNum.toString().padStart(2, '0')}-01`;
  }
  
  // Handle existing ISO format (YYYY-MM-DD)
  const isoDate = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    // Validate the date
    try {
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        return dateStr;
      }
    } catch {
      return null;
    }
  }
  
  // Try to extract year as fallback
  const yearMatch = dateStr.match(/\d{4}/);
  if (yearMatch) {
    return `${yearMatch[0]}-01-01`;
  }
  
  return null;
};

/**
 * Format date for display in UI
 */
export const formatDateForDisplay = (dateStr: DateString | null | undefined): string => {
  if (!dateStr) return 'Present';
  
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, 'MMM yyyy');
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format date range for display
 */
export const formatDateRange = (
  startDate: DateString | null | undefined,
  endDate: DateString | null | undefined,
  isCurrent = false
): string => {
  const start = formatDateForDisplay(startDate);
  const end = isCurrent || !endDate ? 'Present' : formatDateForDisplay(endDate);
  return `${start} - ${end}`;
};

/**
 * Convert date for month input (YYYY-MM format)
 */
export const formatForMonthInput = (dateStr: DateString | null | undefined): string => {
  if (!dateStr) return '';
  
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM');
  } catch {
    return '';
  }
};

/**
 * Convert Date object to ISO date string
 */
export const dateToISOString = (date: Date | null | undefined): DateString | null => {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
};

/**
 * Check if date is expired
 */
export const isDateExpired = (dateStr: DateString | null | undefined): boolean => {
  if (!dateStr) return false;
  
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    return isValid(date) && date < now;
  } catch {
    return false;
  }
};

/**
 * Check if date expires within given months
 */
export const isExpiringWithinMonths = (
  dateStr: DateString | null | undefined,
  months: number
): boolean => {
  if (!dateStr) return false;
  
  try {
    const date = parseISO(dateStr);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);
    const now = new Date();
    
    return isValid(date) && date < futureDate && date > now;
  } catch {
    return false;
  }
};

/**
 * Helper to convert month names to numbers
 */
const getMonthNumber = (monthName: string): number => {
  const months = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };
  
  return months[monthName.toLowerCase()] || 1;
};