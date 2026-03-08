const phpCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

export function formatPHP(value: number): string {
  if (!Number.isFinite(value)) return phpCurrency.format(0);
  return phpCurrency.format(value);
}
