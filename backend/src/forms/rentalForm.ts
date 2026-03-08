export const STANDARD_RENTAL_FORM_VERSION = 'v1';

export type RentalFormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select';

export type RentalFormField = {
  id: string;
  label: string;
  type: RentalFormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

const allowedTypes: RentalFormFieldType[] = ['text', 'textarea', 'number', 'date', 'select'];

export function sanitizeRentalFormFields(input: any): RentalFormField[] {
  if (!Array.isArray(input)) return [];

  const result: RentalFormField[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String(raw.id || '').trim();
    const label = String(raw.label || '').trim();
    const type = String(raw.type || 'text').trim() as RentalFormFieldType;
    if (!id || !label || !allowedTypes.includes(type)) continue;

    const field: RentalFormField = {
      id,
      label,
      type,
      required: Boolean(raw.required),
    };

    const placeholder = String(raw.placeholder || '').trim();
    if (placeholder) field.placeholder = placeholder;

    if (type === 'select') {
      const options = Array.isArray(raw.options)
        ? raw.options.map((option) => String(option).trim()).filter(Boolean)
        : [];
      field.options = options;
      if (!options.length) continue;
    }

    result.push(field);
  }

  return result.slice(0, 30);
}

export function validateRentalCustomAnswers(fields: RentalFormField[], answers: any) {
  const safeAnswers = answers && typeof answers === 'object' ? answers : {};

  for (const field of fields) {
    const value = safeAnswers[field.id];
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
      return { valid: false, error: `Missing required field: ${field.label}` };
    }
  }

  return { valid: true, error: '' };
}
