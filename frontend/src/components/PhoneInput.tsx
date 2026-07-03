import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/src/components/ui';
import { PHONE_COUNTRIES, PHILIPPINES_DIAL_CODE, PHILIPPINES_MOBILE_NATIONAL_LENGTH, buildE164, getPhilippinesMobileNational, normalizeDigits, parseE164 } from '@/src/lib/phone';

interface PhoneInputProps {
  label: string;
  value: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  philippinesMobileOnly?: boolean;
  onChange: (value: string) => void;
}

export function PhoneInput({ label, value, required, disabled, error, philippinesMobileOnly, onChange }: PhoneInputProps) {
  const countryOptions = useMemo(
    () => (philippinesMobileOnly ? PHONE_COUNTRIES.filter((entry) => entry.dial === PHILIPPINES_DIAL_CODE).slice(0, 1) : PHONE_COUNTRIES),
    [philippinesMobileOnly],
  );
  const parsed = useMemo(() => {
    if (philippinesMobileOnly) {
      return { dial: PHILIPPINES_DIAL_CODE, national: getPhilippinesMobileNational(value).slice(0, PHILIPPINES_MOBILE_NATIONAL_LENGTH) };
    }
    return parseE164(value);
  }, [philippinesMobileOnly, value]);
  const [dial, setDial] = useState(parsed.dial);
  const [national, setNational] = useState(parsed.national);

  useEffect(() => {
    setDial(parsed.dial);
    setNational(parsed.national);
  }, [parsed.dial, parsed.national]);

  const selectedCountry = countryOptions.find((entry) => entry.dial === dial) || countryOptions[0] || PHONE_COUNTRIES[0];
  const maxLength = selectedCountry?.maxLength || 15;
  const helper = philippinesMobileOnly
    ? 'Philippine mobile only: enter the 10 digits after +63.'
    : selectedCountry
    ? `Digits required: ${selectedCountry.minLength}${selectedCountry.minLength === selectedCountry.maxLength ? '' : `-${selectedCountry.maxLength}`}`
    : 'Enter digits only';
  const inputMaxLength = philippinesMobileOnly ? undefined : maxLength;

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-1.5 ml-1 block">{label}</label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px,1fr]">
        {philippinesMobileOnly ? (
          <div className="flex h-12 w-full items-center rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 text-sm font-bold text-[var(--tone-text)] shadow-sm">
            +{PHILIPPINES_DIAL_CODE} Philippines
          </div>
        ) : (
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
            {countryOptions.map((country) => (
              <option key={country.dial + country.name} value={country.dial}>
                +{country.dial} {country.name}
              </option>
            ))}
          </select>
        )}
        <Input
          required={required}
          disabled={disabled}
          inputMode="numeric"
          maxLength={inputMaxLength}
          placeholder={`e.g. ${selectedCountry.dial === '63' ? '9XXXXXXXXX' : 'XXXXXXXXXX'}`}
          value={national}
          error={error}
          onChange={(event) => {
            const digits = philippinesMobileOnly
              ? getPhilippinesMobileNational(event.target.value).slice(0, PHILIPPINES_MOBILE_NATIONAL_LENGTH)
              : normalizeDigits(event.target.value).slice(0, maxLength);
            setNational(digits);
            onChange(buildE164(dial, digits));
          }}
        />
      </div>
      {!error && <p className="mt-1 ml-1 text-xs text-[var(--tone-text-muted)]">{helper}</p>}
    </div>
  );
}
