const PHONE_COUNTRIES = [
  { name: 'Philippines', dial: '63', minLength: 10, maxLength: 10 },
  { name: 'United States', dial: '1', minLength: 10, maxLength: 10 },
  { name: 'Canada', dial: '1', minLength: 10, maxLength: 10 },
  { name: 'United Kingdom', dial: '44', minLength: 9, maxLength: 10 },
  { name: 'Australia', dial: '61', minLength: 9, maxLength: 9 },
  { name: 'Singapore', dial: '65', minLength: 8, maxLength: 8 },
  { name: 'Malaysia', dial: '60', minLength: 9, maxLength: 10 },
  { name: 'Japan', dial: '81', minLength: 9, maxLength: 10 },
  { name: 'South Korea', dial: '82', minLength: 9, maxLength: 10 },
  { name: 'India', dial: '91', minLength: 10, maxLength: 10 },
];

export const PHONE_COUNTRY_LIST = PHONE_COUNTRIES;

export const validateE164Phone = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return { valid: false, error: 'Contact number is required' };
  if (!/^\+\d{6,15}$/.test(normalized)) {
    return { valid: false, error: 'Contact number must be in international format (e.g. +63XXXXXXXXXX)' };
  }
  const digits = normalized.slice(1);
  const country = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((entry) => digits.startsWith(entry.dial));
  if (!country) return { valid: false, error: 'Unsupported country code' };
  const national = digits.slice(country.dial.length);
  if (national.length < country.minLength || national.length > country.maxLength) {
    return {
      valid: false,
      error: `Contact number must be ${country.minLength}${country.minLength === country.maxLength ? '' : `-${country.maxLength}`} digits for ${country.name}`,
    };
  }
  return { valid: true, country };
};
