import { useEffect, useMemo, useState } from 'react';
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
import { CalendarClock, CheckCircle2, Clock3, Lock, XCircle } from 'lucide-react';
import { Button, cn } from '@/src/components/ui';

export type CalendarPeriodTone = 'approved' | 'pending' | 'blocked' | 'active' | 'rejected';

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
  approved: 'bg-emerald-500 text-white border-emerald-600',
  pending: 'bg-yellow-300 text-yellow-900 border-yellow-400',
  blocked: 'bg-slate-500 text-white border-slate-600',
  active: 'bg-blue-500 text-white border-blue-600',
  rejected: 'bg-rose-500 text-white border-rose-600',
};

const tonePriority: CalendarPeriodTone[] = ['blocked', 'active', 'approved', 'pending', 'rejected'];
const toneMeta: Record<CalendarPeriodTone, { label: string; icon: typeof CheckCircle2; badgeClass: string; barClass: string }> = {
  approved: { label: 'Approved', icon: CheckCircle2, badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', barClass: 'bg-emerald-500' },
  active: { label: 'Reserved/Ongoing', icon: CalendarClock, badgeClass: 'text-blue-700 bg-blue-50 border-blue-200', barClass: 'bg-blue-500' },
  pending: { label: 'Pending', icon: Clock3, badgeClass: 'text-amber-700 bg-amber-50 border-amber-200', barClass: 'bg-amber-500' },
  rejected: { label: 'Not Approved', icon: XCircle, badgeClass: 'text-rose-700 bg-rose-50 border-rose-200', barClass: 'bg-rose-500' },
  blocked: { label: 'Manual Block', icon: Lock, badgeClass: 'text-slate-700 bg-slate-50 border-slate-200', barClass: 'bg-slate-500' },
};

export function PeriodCalendar({ periods }: PeriodCalendarProps) {
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [selectedTones, setSelectedTones] = useState<CalendarPeriodTone[]>([]);
  const [periodPage, setPeriodPage] = useState(1);
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; periods: CalendarPeriod[] } | null>(null);
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const availableTones = useMemo(
    () => [...new Set(periods.map((period) => period.tone))].sort((a, b) => tonePriority.indexOf(a) - tonePriority.indexOf(b)),
    [periods],
  );
  const activeTones = selectedTones.length ? selectedTones : availableTones;
  const displayedPeriods = useMemo(() => periods.filter((period) => activeTones.includes(period.tone)), [periods, activeTones]);

  const periodsForMonth = useMemo(
    () =>
      displayedPeriods
        .filter((period) => {
          const start = parseISO(period.start);
          const end = parseISO(period.end);
          return end >= monthStart && start <= monthEnd;
        })
        .sort((a, b) => a.start.localeCompare(b.start)),
    [displayedPeriods, monthStart, monthEnd],
  );
  const periodsPerPage = 8;
  const periodsPageCount = Math.max(1, Math.ceil(periodsForMonth.length / periodsPerPage));
  const paginatedPeriods = periodsForMonth.slice((periodPage - 1) * periodsPerPage, periodPage * periodsPerPage);

  useEffect(() => {
    if (!availableTones.length) return;
    setSelectedTones((prev) => (prev.length ? prev.filter((tone) => availableTones.includes(tone)) : availableTones));
  }, [availableTones]);

  useEffect(() => {
    setPeriodPage(1);
  }, [monthCursor, activeTones.join(',')]);

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
          const dayPeriods = displayedPeriods.filter((period) =>
            isWithinInterval(day, {
              start: parseISO(period.start),
              end: parseISO(period.end),
            }),
          );
          const tones = [...new Set(dayPeriods.map((period) => period.tone))].sort((a, b) => tonePriority.indexOf(a) - tonePriority.indexOf(b));
          const hoverTitle = dayPeriods.length
            ? dayPeriods.map((period) => period.label).join('\n')
            : 'No bookings/blocks';
          return (
            <div
              key={day.toISOString()}
              title={hoverTitle}
              onMouseEnter={() => setHoveredDay({ date: day, periods: dayPeriods })}
              onMouseLeave={() => setHoveredDay((prev) => (prev?.date.toDateString() === day.toDateString() ? null : prev))}
              className={cn(
                'relative min-h-9 rounded-md border p-2 text-xs',
                !isSameMonth(day, monthCursor) && 'opacity-40',
                tones.length === 1 ? toneClass[tones[0]] : tones.length > 1 ? 'bg-background text-foreground' : 'bg-background text-muted-foreground',
              )}
            >
              {format(day, 'd')}
              {tones.length > 1 && (
                <div className="absolute inset-x-1 bottom-1 flex h-1.5 overflow-hidden rounded-full">
                  {tones.map((tone) => (
                    <span key={`${day.toISOString()}-${tone}`} className={cn('h-full flex-1', toneMeta[tone].barClass)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {availableTones.map((tone) => {
          const ToneIcon = toneMeta[tone].icon;
          const selected = activeTones.includes(tone);
          return (
            <button
              key={tone}
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 transition',
                selected ? toneMeta[tone].badgeClass : 'bg-white text-slate-500 border-slate-200',
              )}
              onClick={() =>
                setSelectedTones((prev) => {
                  const current = prev.length ? prev : availableTones;
                  const next = current.includes(tone) ? current.filter((value) => value !== tone) : [...current, tone];
                  return next.length ? next : availableTones;
                })
              }
            >
              <ToneIcon className="h-3 w-3" /> {toneMeta[tone].label}
            </button>
          );
        })}
      </div>

      {hoveredDay?.periods?.length ? (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hover details • {format(hoveredDay.date, 'MMM dd, yyyy')}</p>
          <div className="space-y-2">
            {hoveredDay.periods.map((period) => {
              const ToneIcon = toneMeta[period.tone].icon;
              return (
                <div key={`hover-${period.id}`} className="flex items-start gap-2 text-xs">
                  <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold', toneMeta[period.tone].badgeClass)}>
                    <ToneIcon className="h-3 w-3" /> {toneMeta[period.tone].label}
                  </span>
                  <p className="text-muted-foreground">{period.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 text-sm">
        <p className="font-medium text-muted-foreground">Periods this month</p>
        {periodsForMonth.length === 0 ? (
          <p className="text-sm text-green-700">No blocked or booked periods this month.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {paginatedPeriods.map((period) => {
                const ToneIcon = toneMeta[period.tone].icon;
                return (
                  <div key={period.id} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold', toneClass[period.tone])}>
                        <ToneIcon className="h-3 w-3" /> {toneMeta[period.tone].label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{format(parseISO(period.start), 'MMM dd, yyyy')} to {format(parseISO(period.end), 'MMM dd, yyyy')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{period.label}</p>
                  </div>
                );
              })}
            </div>
            {periodsPageCount > 1 && (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPeriodPage((prev) => Math.max(1, prev - 1))} disabled={periodPage === 1}>
                  Previous
                </Button>
                <p className="text-xs text-muted-foreground">
                  Page {periodPage} of {periodsPageCount}
                </p>
                <Button variant="outline" size="sm" onClick={() => setPeriodPage((prev) => Math.min(periodsPageCount, prev + 1))} disabled={periodPage === periodsPageCount}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
