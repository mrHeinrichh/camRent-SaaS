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
const PHILIPPINES_DIAL_CODE = '63';

const normalizeDigits = (value: unknown) => String(value || '').replace(/\D/g, '');

export const getPhilippinesMobileNational = (value: unknown) => {
  const raw = String(value || '').trim();
  const digits = normalizeDigits(raw);
  let national = digits;
  if (raw.startsWith('+') && digits.startsWith(PHILIPPINES_DIAL_CODE)) {
    national = digits.slice(PHILIPPINES_DIAL_CODE.length);
  } else if (digits.startsWith(PHILIPPINES_DIAL_CODE)) {
    national = digits.slice(PHILIPPINES_DIAL_CODE.length);
  }
  return national.startsWith('0') ? national.slice(1) : national;
};

export const normalizePhilippinesMobilePhone = (value: unknown) => {
  const national = getPhilippinesMobileNational(value);
  return /^9\d{9}$/.test(national) ? `+${PHILIPPINES_DIAL_CODE}${national}` : '';
};

export const validatePhilippinesMobilePhone = (value: unknown, label = 'Contact number') => {
  const raw = String(value || '').trim();
  if (!raw) return { valid: false, error: `${label} is required` };
  const normalized = normalizePhilippinesMobilePhone(raw);
  if (!normalized) {
    return {
      valid: false,
      error: `${label} must be a valid Philippine mobile number (11 digits, e.g. 09171234567)`,
    };
  }
  return { valid: true, normalized };
};

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
