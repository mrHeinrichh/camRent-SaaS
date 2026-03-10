export interface PhoneCountry {
  name: string;
  dial: string;
  minLength: number;
  maxLength: number;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: 'Philippines (+63)', dial: '63', minLength: 10, maxLength: 10 },
  { name: 'United States (+1)', dial: '1', minLength: 10, maxLength: 10 },
  { name: 'Canada (+1)', dial: '1', minLength: 10, maxLength: 10 },
  { name: 'United Kingdom (+44)', dial: '44', minLength: 9, maxLength: 10 },
  { name: 'Australia (+61)', dial: '61', minLength: 9, maxLength: 9 },
  { name: 'Singapore (+65)', dial: '65', minLength: 8, maxLength: 8 },
  { name: 'Malaysia (+60)', dial: '60', minLength: 9, maxLength: 10 },
  { name: 'Japan (+81)', dial: '81', minLength: 9, maxLength: 10 },
  { name: 'South Korea (+82)', dial: '82', minLength: 9, maxLength: 10 },
  { name: 'India (+91)', dial: '91', minLength: 10, maxLength: 10 },
];

export const normalizeDigits = (value: string) => String(value || '').replace(/\D/g, '');

export const parseE164 = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed.startsWith('+')) {
    return { dial: '63', national: normalizeDigits(trimmed) };
  }
  const digits = normalizeDigits(trimmed);
  const match = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((entry) => digits.startsWith(entry.dial));
  if (!match) return { dial: '63', national: digits };
  return { dial: match.dial, national: digits.slice(match.dial.length) };
};

export const buildE164 = (dial: string, national: string) => {
  const digits = normalizeDigits(national);
  if (!digits) return '';
  return `+${dial}${digits}`;
};

export const validatePhone = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return { valid: false, error: 'Contact number is required' };
  if (!/^\+\d{6,15}$/.test(trimmed)) {
    return { valid: false, error: 'Contact number must be in international format (e.g. +63XXXXXXXXXX)' };
  }
  const digits = normalizeDigits(trimmed);
  const match = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((entry) => digits.startsWith(entry.dial));
  if (!match) return { valid: false, error: 'Unsupported country code' };
  const national = digits.slice(match.dial.length);
  if (national.length < match.minLength || national.length > match.maxLength) {
    return { valid: false, error: `Contact number must be ${match.minLength}${match.minLength === match.maxLength ? '' : `-${match.maxLength}`} digits for ${match.name}` };
  }
  return { valid: true };
};
