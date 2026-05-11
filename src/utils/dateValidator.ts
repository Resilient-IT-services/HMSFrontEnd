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
