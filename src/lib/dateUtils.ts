/**
 * Centralized date utility functions to ensure consistent MM/DD/YYYY formatting
 * across the entire application
 */

/**
 * Format a date string to MM/DD/YYYY format
 * @param dateString - Date string in any valid format (YYYY-MM-DD, YYYY-MM, etc.)
 * @returns Formatted date string in MM/DD/YYYY format, or empty string if invalid
 */
export const formatDateToMMDDYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Handle YYYY-MM format by appending -01 for day
    const normalizedDate = dateString.includes('-') && dateString.split('-').length === 2 
      ? `${dateString}-01` 
      : dateString;
    
    const date = new Date(normalizedDate);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('Date parsing error:', error);
    return dateString; // Return original if error occurs
  }
};

/**
 * Format a date string to MM/YYYY format (for month-only dates)
 * @param dateString - Date string in any valid format
 * @returns Formatted date string in MM/YYYY format, or empty string if invalid
 */
export const formatDateToMMYYYY = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Handle YYYY-MM format by appending -01 for day
    const normalizedDate = dateString.includes('-') && dateString.split('-').length === 2 
      ? `${dateString}-01` 
      : dateString;
    
    const date = new Date(normalizedDate);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit'
    });
  } catch (error) {
    console.warn('Date parsing error:', error);
    return dateString; // Return original if error occurs
  }
};

/**
 * Format a date range to MM/DD/YYYY - MM/DD/YYYY or MM/DD/YYYY - Present
 * @param startDate - Start date string
 * @param endDate - End date string (optional)
 * @param isCurrent - Whether this is a current/ongoing date range
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string, 
  endDate: string | null | undefined, 
  isCurrent?: boolean
): string => {
  const start = formatDateToMMDDYYYY(startDate);
  
  if (isCurrent) {
    return `${start} - Present`;
  }
  
  if (!endDate) {
    return start;
  }
  
  const end = formatDateToMMDDYYYY(endDate);
  return `${start} - ${end}`;
};

/**
 * Format a date for display purposes (shorter format for space-constrained areas)
 * @param dateString - Date string in any valid format
 * @returns Formatted date string in MM/DD/YYYY format
 */
export const formatDateForDisplay = (dateString: string): string => {
  return formatDateToMMDDYYYY(dateString);
};

/**
 * Convert a date to the format expected by HTML date inputs (YYYY-MM-DD)
 * @param dateString - Date string in any format
 * @returns Date string in YYYY-MM-DD format for HTML inputs
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const normalizedDate = dateString.includes('-') && dateString.split('-').length === 2 
      ? `${dateString}-01` 
      : dateString;
    
    const date = new Date(normalizedDate);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Date input formatting error:', error);
    return '';
  }
};

/**
 * Get today's date in MM/DD/YYYY format
 * @returns Today's date in MM/DD/YYYY format
 */
export const getTodayFormatted = (): string => {
  return formatDateToMMDDYYYY(new Date().toISOString());
};

/**
 * Check if a date string is valid
 * @param dateString - Date string to validate
 * @returns True if the date is valid, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const normalizedDate = dateString.includes('-') && dateString.split('-').length === 2 
      ? `${dateString}-01` 
      : dateString;
    
    const date = new Date(normalizedDate);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};