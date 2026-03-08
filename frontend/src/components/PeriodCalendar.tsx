import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Button, cn } from '@/src/components/ui';

export type CalendarPeriodTone = 'approved' | 'pending' | 'blocked' | 'active';

export interface CalendarPeriod {
  id: string;
  start: string;
  end: string;
  label: string;
  tone: CalendarPeriodTone;
}

interface PeriodCalendarProps {
  periods: CalendarPeriod[];
}

const toneClass: Record<CalendarPeriodTone, string> = {
  approved: 'bg-red-500 text-white border-red-600',
  pending: 'bg-yellow-300 text-yellow-900 border-yellow-400',
  blocked: 'bg-slate-500 text-white border-slate-600',
  active: 'bg-blue-500 text-white border-blue-600',
};

function getDayTone(periods: CalendarPeriod[]): CalendarPeriodTone | null {
  if (periods.some((period) => period.tone === 'blocked')) return 'blocked';
  if (periods.some((period) => period.tone === 'approved')) return 'approved';
  if (periods.some((period) => period.tone === 'active')) return 'active';
  if (periods.some((period) => period.tone === 'pending')) return 'pending';
  return null;
}

export function PeriodCalendar({ periods }: PeriodCalendarProps) {
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const periodsForMonth = useMemo(
    () =>
      periods
        .filter((period) => {
          const start = parseISO(period.start);
          const end = parseISO(period.end);
          return end >= monthStart && start <= monthEnd;
        })
        .sort((a, b) => a.start.localeCompare(b.start)),
    [periods, monthStart, monthEnd],
  );

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setMonthCursor((prev) => subMonths(prev, 1))}>
          Prev
        </Button>
        <p className="text-sm font-semibold">{format(monthCursor, 'MMMM yyyy')}</p>
        <Button variant="outline" size="sm" onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}>
          Next
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <div key={day} className="p-1 font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayPeriods = periods.filter((period) =>
            isWithinInterval(day, {
              start: parseISO(period.start),
              end: parseISO(period.end),
            }),
          );
          const tone = getDayTone(dayPeriods);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'rounded-md border p-2 text-xs',
                !isSameMonth(day, monthCursor) && 'opacity-40',
                tone ? toneClass[tone] : 'bg-background text-muted-foreground',
              )}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-medium text-muted-foreground">Periods this month</p>
        {periodsForMonth.length === 0 ? (
          <p className="text-sm text-green-700">No blocked or booked periods this month.</p>
        ) : (
          <ul className="space-y-1">
            {periodsForMonth.map((period) => (
              <li key={period.id} className="rounded border bg-muted/20 px-2 py-1">
                {period.start} to {period.end} • {period.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
