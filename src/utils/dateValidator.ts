import dayjs from '@/lib/dayjs';

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
 * @param tz Optional timezone to anchor the start of day to (e.g., "Asia/Kolkata")
 * @returns ISO string (e.g., "2026-05-18T18:30:00.000Z")
 */
export const getLocalStartOfDayISO = (date?: Date | string, tz?: string | null): string => {
  let d = dayjs(date);
  if (tz) {
    d = d.tz(tz);
  }
  return d.startOf('day').toISOString();
};

/**
 * Calculates the exact UTC boundaries for a given date based on a hospital's timezone.
 * @param hospitalTz The hospital's timezone identifier
 * @param targetDate Optional date to calculate range for
 * @returns { from: string, to: string } UTC ISO strings
 */
export const getHospitalDayRangeUTC = (hospitalTz: string, targetDate?: Date | string) => {
  const base = dayjs(targetDate).tz(hospitalTz);
  return {
    from: base.startOf('day').toISOString(),
    to: base.endOf('day').toISOString()
  };
};
