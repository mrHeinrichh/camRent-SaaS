import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/src/components/ui';
import { PHONE_COUNTRIES, buildE164, normalizeDigits, parseE164 } from '@/src/lib/phone';

interface PhoneInputProps {
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export function PhoneInput({ label, value, required, disabled, error, onChange }: PhoneInputProps) {
  const parsed = useMemo(() => parseE164(value), [value]);
  const [dial, setDial] = useState(parsed.dial);
  const [national, setNational] = useState(parsed.national);

  useEffect(() => {
    setDial(parsed.dial);
    setNational(parsed.national);
  }, [parsed.dial, parsed.national]);

  const selectedCountry = PHONE_COUNTRIES.find((entry) => entry.dial === dial) || PHONE_COUNTRIES[0];
  const maxLength = selectedCountry?.maxLength || 15;
  const helper = selectedCountry
    ? `Digits required: ${selectedCountry.minLength}${selectedCountry.minLength === selectedCountry.maxLength ? '' : `-${selectedCountry.maxLength}`}`
    : 'Enter digits only';

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-1.5 ml-1 block">{label}</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px,1fr]">
        <select
          className="h-12 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 text-sm transition-all focus:border-[var(--tone-accent)] focus:ring-4 focus:ring-[var(--tone-accent)]/20 shadow-sm"
          value={dial}
          onChange={(event) => {
            const nextDial = event.target.value;
            setDial(nextDial);
            const nextValue = buildE164(nextDial, national);
            onChange(nextValue);
          }}
          disabled={disabled}
        >
          {PHONE_COUNTRIES.map((country) => (
            <option key={country.dial + country.name} value={country.dial}>
              +{country.dial} {country.name}
            </option>
          ))}
        </select>
        <Input
          required={required}
          disabled={disabled}
          inputMode="numeric"
          placeholder={`e.g. ${selectedCountry.dial === '63' ? '9XXXXXXXXX' : 'XXXXXXXXXX'}`}
          value={national}
          error={error}
          onChange={(event) => {
            const digits = normalizeDigits(event.target.value).slice(0, maxLength);
            setNational(digits);
            onChange(buildE164(dial, digits));
          }}
        />
      </div>
      {!error && <p className="mt-1 ml-1 text-xs text-[var(--tone-text-muted)]">{helper}</p>}
    </div>
  );
}
