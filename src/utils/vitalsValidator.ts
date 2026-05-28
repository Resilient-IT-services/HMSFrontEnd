import { VitalRange } from '@/types/api';

/**
 * Validates a vital measurement against a provided range.
 * 
 * @param value The value to validate
 * @param range The range configuration from backend
 * @param label The label for the vital (for error messages)
 * @param isRequired Whether the field is mandatory
 * @returns Error message string or null if valid
 */
export const validateVital = (
  value: string | number | null | undefined,
  range?: VitalRange,
  label: string = 'Value',
  isRequired: boolean = true
): string | null => {
  // Handle empty values
  if (value === '' || value === null || value === undefined) {
    return isRequired ? `${label} is required` : null;
  }

  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value;

  // Handle non-numeric input
  if (Number.isNaN(numValue)) {
    return `Invalid ${label.toLowerCase()}`;
  }

  // Handle range validation if config exists
  if (range && (numValue < range.minValue || numValue > range.maxValue)) {
    return range.errorMessage || `${label} must be between ${range.minValue} and ${range.maxValue}`;
  }

  return null;
};

/**
 * Formats a range for display as helper text.
 * 
 * @param range The range configuration
 * @returns Formatted string or null
 */
export const formatRangeHelper = (range?: VitalRange): string | null => {
  if (!range) return null;
  return `Allowed range: ${range.minValue} - ${range.maxValue}`;
};
