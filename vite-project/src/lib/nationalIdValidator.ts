/**
 * Iranian National ID Validation Utility
 * Matches the Django backend validator
 */

export function validateIranianNationalId(nationalId: string): { isValid: boolean; error?: string } {
  // Check if empty or not provided
  if (!nationalId) {
    return { isValid: false, error: "کد ملی الزامی است" };
  }

  // Check length
  if (nationalId.length !== 10) {
    return { isValid: false, error: "کد ملی باید ۱۰ رقم باشد" };
  }

  // Check if all digits are the same
  if (nationalId === nationalId[0].repeat(10)) {
    return { isValid: false, error: "کد ملی نامعتبر است" };
  }

  // Check if all characters are numeric
  if (!/^\d+$/.test(nationalId)) {
    return { isValid: false, error: "کد ملی باید فقط شامل اعداد باشد" };
  }

  // Calculate checksum
  const digits = nationalId.split('').map(d => parseInt(d, 10));
  const checkDigit = digits.pop()!;
  
  const sum = digits.reduce((acc, digit, index) => {
    return acc + (digit * (10 - index));
  }, 0);
  
  const remainder = sum % 11;
  const validCheckDigit = remainder < 2 ? remainder : 11 - remainder;

  if (checkDigit !== validCheckDigit) {
    return { isValid: false, error: "کد ملی نامعتبر است" };
  }

  return { isValid: true };
}

export function formatNationalId(value: string): string {
  // Remove non-numeric characters and limit to 10 digits
  return value.replace(/\D/g, '').slice(0, 10);
}
