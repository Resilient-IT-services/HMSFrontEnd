/**
 * Validates a Date of Birth string.
 * @param dob The DOB string to validate (YYYY-MM-DD)
 * @param maxAge The maximum age allowed (default 110)
 * @returns { isValid: boolean, message?: string }
 */
export const validateDOB = (dob: string, maxAge: number = 110): { isValid: boolean, message?: string } => {
  if (!dob) {
    return { isValid: false, message: 'Date of birth is required' };
  }

  const dobDate = new Date(dob);
  const today = new Date();
  
  // Basic date validity check
  if (isNaN(dobDate.getTime())) {
    return { isValid: false, message: 'You entered a wrong date of birth' };
  }

  // Future date check
  if (dobDate > today) {
    return { isValid: false, message: 'You entered a wrong date of birth' };
  }

  // Age limit check
  const oldestAllowedDate = new Date();
  oldestAllowedDate.setFullYear(today.getFullYear() - maxAge);
  
  if (dobDate < oldestAllowedDate) {
    return { isValid: false, message: 'You entered a wrong date of birth' };
  }

  return { isValid: true };
};

/**
 * Returns the local start of the day in ISO 8601 format (UTC).
 * If a string is provided, it assumes it's a YYYY-MM-DD local date and returns its start of day.
 * @param date Optional date or date string
 * @returns ISO string (e.g., "2026-05-18T18:30:00.000Z")
 */
export const getLocalStartOfDayISO = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  
  // If it's a string like "2026-05-19", new Date(date) creates it in UTC 00:00:00.
  // We want the LOCAL start of that day.
  if (typeof date === 'string' && date.length === 10) {
    const [year, month, day] = date.split('-').map(Number);
    d.setFullYear(year, month - 1, day);
  }
  
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

