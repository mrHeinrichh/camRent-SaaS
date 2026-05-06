const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RentalBillingMode = 'calendar_day' | 'twenty_four_hour';

export function getRentalDayCount(input: { startDate: string; endDate: string; startTime?: string; endTime?: string; rentalBillingMode?: RentalBillingMode }) {
  if (input.rentalBillingMode === 'calendar_day') {
    const start = new Date(`${input.startDate}T00:00`);
    const end = new Date(`${input.endDate}T00:00`);
    const diffMs = end.getTime() - start.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return 1;
    return Math.max(1, Math.floor(diffMs / MS_PER_DAY) + 1);
  }
  const start = new Date(`${input.startDate}T${input.startTime || '00:00'}`);
  const end = new Date(`${input.endDate}T${input.endTime || '23:59'}`);
  const diffMs = end.getTime() - start.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 1;
  return Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
}
