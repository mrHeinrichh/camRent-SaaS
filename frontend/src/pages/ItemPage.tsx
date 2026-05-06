import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { getRentalBillingModeLabel, getRentalDayCount } from '@/src/lib/rentalPricing';
import { useAppStore } from '@/src/store';
import type { Item } from '@/src/types/domain';
import { Button, Input, cn } from '@/src/components/ui';

interface ItemPageProps {
  itemId: string;
}

export function ItemPage({ itemId }: ItemPageProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(addDays(new Date(), 1)));
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { addToCart, user } = useAppStore();

  useEffect(() => {
    api
      .get<Item>(`/api/items/${itemId}`)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [itemId]);

  const selectedStart = useMemo(() => parseISO(startDate), [startDate]);
  const selectedEnd = useMemo(() => parseISO(endDate), [endDate]);
  const selectedStartDateTime = useMemo(() => parseISO(`${startDate}T${startTime || '00:00'}`), [startDate, startTime]);
  const selectedEndDateTime = useMemo(() => parseISO(`${endDate}T${endTime || '23:59'}`), [endDate, endTime]);
  const rentalBillingMode = item?.rental_billing_mode === 'calendar_day' ? 'calendar_day' : 'twenty_four_hour';
  const rentalBillingModeLabel = getRentalBillingModeLabel(rentalBillingMode);
  const selectedRentalDays = useMemo(
    () => getRentalDayCount({ startDate, endDate, startTime, endTime, rentalBillingMode }),
    [endDate, endTime, rentalBillingMode, startDate, startTime],
  );
  const visibleMonth = useMemo(() => startOfMonth(calendarMonth), [calendarMonth]);
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(visibleMonth), end: endOfWeek(endOfMonth(visibleMonth)) }),
    [visibleMonth],
  );

  const rangeOverlaps = (rangeStart: Date, rangeEnd: Date, blockStart: string, blockEnd: string) => {
    const blockedStart = parseISO(blockStart);
    const blockedEnd = parseISO(blockEnd);
    return !isBefore(rangeEnd, blockedStart) && !isBefore(blockedEnd, rangeStart);
  };

  const selectedOverlap = useMemo(() => {
    if (!item || isBefore(selectedEnd, selectedStart)) return null;
    const booking = item.bookings?.find((entry) => rangeOverlaps(selectedStart, selectedEnd, entry.start_date, entry.end_date));
    if (booking) return { type: 'booking' as const, status: booking.status };
    const manualBlock = item.manualBlocks?.find((entry) => rangeOverlaps(selectedStart, selectedEnd, entry.start_date, entry.end_date));
    if (manualBlock) return { type: 'block' as const, status: manualBlock.reason || 'Blocked' };
    return null;
  }, [item, selectedEnd, selectedStart]);

  const handleAddToCart = () => {
    if (!item) return;
    setCartNotice(null);
    
    if (user?.role === 'owner') {
      setCartNotice({ type: 'error', message: 'Store owners cannot rent items.' });
      return;
    }
    if (item.is_available === false || (item.stock || 0) <= 0) {
      setCartNotice({ type: 'error', message: 'This gear is currently unavailable.' });
      return;
    }
    if (isBefore(selectedEnd, selectedStart)) {
      setCartNotice({ type: 'error', message: 'End date cannot be before start date.' });
      return;
    }
    if (!isBefore(selectedStartDateTime, selectedEndDateTime)) {
      setCartNotice({ type: 'error', message: 'End time must be after start time.' });
      return;
    }
    if (selectedOverlap) {
      setCartNotice({ type: 'error', message: 'Selected dates overlap with an existing booking or blocked date.' });
      return;
    }

    addToCart({
      ...item,
      startDate,
      endDate,
      startTime,
      endTime,
      rentalBillingMode,
      quantity: Math.max(1, Math.min(quantity, item.stock || 1)),
    });
    
    setCartNotice({ type: 'success', message: 'Added to cart!' });
    setTimeout(() => setCartNotice(null), 3000);
  };

  if (loading) return <div className="flex h-96 items-center justify-center">Loading item...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="aspect-square overflow-hidden rounded-3xl border bg-muted">
            <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/800/800`} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="mb-2 text-4xl font-bold">{item.name}</h1>
            <p className="text-lg text-muted-foreground">{item.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">Brand: {item.brand || ''}</p>
          </div>

          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Rate</p>
                <p className="text-3xl font-bold">{formatPHP(item.daily_price)}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Selected: {selectedRentalDays} billing day{selectedRentalDays === 1 ? '' : 's'} by {rentalBillingModeLabel} ({formatPHP(item.daily_price * selectedRentalDays)} per item)
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available Stock</p>
                <p className="font-semibold">{Math.max(0, item.stock || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    setStartDate(nextStart);
                    setCalendarMonth(startOfMonth(parseISO(nextStart)));
                    if (endDate && isBefore(parseISO(endDate), parseISO(nextStart))) {
                      setEndDate(nextStart);
                    }
                    setCartNotice(null);
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    const nextEnd = event.target.value;
                    setEndDate(nextEnd);
                    if (!isSameMonth(parseISO(nextEnd), visibleMonth)) {
                      setCalendarMonth(startOfMonth(parseISO(nextEnd)));
                    }
                    setCartNotice(null);
                  }}
                  min={startDate}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setCartNotice(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setCartNotice(null);
                  }}
                />
              </div>
            </div>
            <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900">
              {rentalBillingMode === 'calendar_day'
                ? 'This shop charges by calendar day. Each selected calendar date counts as one billing day.'
                : 'This shop charges by 24-hour period from the selected start date/time to end date/time.'}
            </p>
            {!isBefore(selectedStartDateTime, selectedEndDateTime) ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">End time must be after start time.</div>
            ) : null}
            {selectedOverlap ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
                Selected dates overlap with {selectedOverlap.type === 'booking' ? `a ${selectedOverlap.status.toLowerCase().replace(/_/g, ' ')} booking` : 'a blocked date'}.
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                  -
                </Button>
                <div className="min-w-14 rounded-md border px-3 py-2 text-center text-sm font-semibold">{quantity}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity((prev) => Math.min(Math.max(1, item.stock || 1), prev + 1))}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="h-12 w-full text-lg" onClick={handleAddToCart} disabled={user?.role === 'owner' || item.is_available === false || (item.stock || 0) <= 0}>
                {user?.role === 'owner' ? 'Owners Cannot Rent' : item.is_available === false || (item.stock || 0) <= 0 ? 'Currently Unavailable' : 'Add to Cart'}
              </Button>
              
              {cartNotice && (
                <div className={cn(
                  "rounded-lg p-3 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
                  cartNotice.type === 'success' ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-900 border-red-200"
                )}>
                  {cartNotice.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold">
              <CalendarIcon className="h-5 w-5" />
              Availability Calendar
            </h3>
            <p className="text-xs font-medium text-muted-foreground">Calendar shows availability by date. Pricing for this shop is based on {rentalBillingModeLabel}.</p>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-green-500" /> Available
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-yellow-400" /> Pending
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-red-500" /> Booked
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-blue-500" /> Selected
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => setCalendarMonth((month) => subMonths(month, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center text-sm font-semibold text-foreground">{format(visibleMonth, 'MMMM yyyy')}</div>
                <Button type="button" variant="outline" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => setCalendarMonth((month) => addMonths(month, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="p-1 font-bold">
                    {day}
                  </div>
                ))}

                {calendarDays.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const booking = item.bookings?.find((entry) =>
                    isWithinInterval(parseISO(dateStr), { start: parseISO(entry.start_date), end: parseISO(entry.end_date) }),
                  );
                  const manualBlock = item.manualBlocks?.find((entry) =>
                    isWithinInterval(parseISO(dateStr), { start: parseISO(entry.start_date), end: parseISO(entry.end_date) }),
                  );
                  const isSelected = !isBefore(selectedEnd, selectedStart) && isWithinInterval(date, { start: selectedStart, end: selectedEnd });
                  const isRangeEdge = isSameDay(date, selectedStart) || isSameDay(date, selectedEnd);
                  const inCurrentMonth = isSameMonth(date, visibleMonth);
                  const hasConflict = Boolean(booking || manualBlock);

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'min-h-9 rounded-md border p-2 text-muted-foreground',
                        !inCurrentMonth && 'opacity-35',
                        isSelected && hasConflict
                          ? 'border-red-700 bg-red-600 font-bold text-white ring-2 ring-red-300'
                          : isSelected
                          ? cn('border-blue-600 bg-blue-500 font-bold text-white ring-2 ring-blue-200', isRangeEdge && 'ring-blue-400')
                          : booking?.status === 'APPROVED' || booking?.status === 'ONGOING'
                            ? 'border-red-600 bg-red-500 text-white'
                            : booking?.status === 'PENDING_REVIEW'
                            ? 'border-yellow-500 bg-yellow-400 text-yellow-900'
                            : manualBlock
                              ? 'border-gray-500 bg-gray-400 text-white'
                              : 'cursor-pointer bg-background hover:bg-muted',
                      )}
                    >
                      {format(date, 'd')}
                      {(booking?.start_time || booking?.end_time) ? (
                        <span className="mt-0.5 block truncate text-[8px] leading-tight">
                          {booking.start_time || '--:--'}-{booking.end_time || '--:--'}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
