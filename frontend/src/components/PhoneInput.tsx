import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/src/components/ui';
import { PHONE_COUNTRIES, buildE164, normalizeDigits, parseE164 } from '@/src/lib/phone';

interface PhoneInputProps {
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function PhoneInput({ label, value, required, disabled, onChange }: PhoneInputProps) {
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
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[180px,1fr]">
        <select
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
              {country.name}
            </option>
          ))}
        </select>
        <Input
          required={required}
          disabled={disabled}
          inputMode="numeric"
          placeholder={`e.g. ${selectedCountry.dial === '63' ? '9XXXXXXXXX' : 'XXXXXXXXXX'}`}
          value={national}
          onChange={(event) => {
            const digits = normalizeDigits(event.target.value).slice(0, maxLength);
            setNational(digits);
            onChange(buildE164(dial, digits));
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
