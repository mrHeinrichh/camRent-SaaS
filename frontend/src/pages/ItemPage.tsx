import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { getRentalBillingModeLabel, getRentalDayCount } from '@/src/lib/rentalPricing';
import { useAppStore } from '@/src/store';
import type { CartItem, Item } from '@/src/types/domain';
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
  const productImageRef = useRef<HTMLDivElement | null>(null);
  const { addToCart, cart, user } = useAppStore();

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

  const triggerCartAnimation = (currentItem: Item, fallbackSource?: HTMLElement) => {
    if (typeof window === 'undefined') return;

    const cartTarget = document.querySelector<HTMLElement>('[data-cart-target="true"]');
    const imageRect = productImageRef.current?.getBoundingClientRect();
    const imageIsVisible = Boolean(
      imageRect &&
      imageRect.bottom > 0 &&
      imageRect.top < window.innerHeight &&
      imageRect.right > 0 &&
      imageRect.left < window.innerWidth,
    );
    const sourceElement = imageIsVisible ? productImageRef.current : fallbackSource;
    if (!sourceElement || !cartTarget) return;

    const sourceRect = sourceElement.getBoundingClientRect();
    const cartRect = cartTarget.getBoundingClientRect();
    const size = Math.max(42, Math.min(76, sourceRect.width * 0.28));
    const startX = sourceRect.left + sourceRect.width / 2 - size / 2;
    const startY = sourceRect.top + sourceRect.height / 2 - size / 2;
    const endX = cartRect.left + cartRect.width / 2 - size / 2;
    const endY = cartRect.top + cartRect.height / 2 - size / 2;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    const flyer = document.createElement('div');
    flyer.setAttribute('aria-hidden', 'true');
    flyer.dataset.cartFlyer = 'true';
    Object.assign(flyer.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      zIndex: '80',
      pointerEvents: 'none',
    });

    const glow = document.createElement('div');
    Object.assign(glow.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: '18px',
      background: 'rgba(245, 158, 11, 0.3)',
      filter: 'blur(10px)',
    });

    const image = document.createElement('img');
    image.src = currentItem.image_url || `https://picsum.photos/seed/item-${currentItem.id}/800/800`;
    image.alt = '';
    image.referrerPolicy = 'no-referrer';
    Object.assign(image.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '18px',
      border: '2px solid white',
      background: 'white',
      boxShadow: '0 18px 36px rgba(15, 23, 42, 0.25)',
    });

    const badge = document.createElement('span');
    badge.textContent = '+1';
    Object.assign(badge.style, {
      position: 'absolute',
      right: '-4px',
      top: '-4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      borderRadius: '999px',
      background: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontSize: '10px',
      fontWeight: '900',
      boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)',
    });

    flyer.append(glow, image, badge);
    document.body.appendChild(flyer);

    const duration = 780;
    const startedAt = performance.now();
    const animateFlyer = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const arc = Math.sin(progress * Math.PI) * -54;
      const scale = 1 - eased * 0.72;
      const rotate = -8 + eased * 18;
      const opacity = progress > 0.72 ? Math.max(0, 1 - (progress - 0.72) / 0.28) : 0.96;

      flyer.style.transform = `translate3d(${deltaX * eased}px, ${deltaY * eased + arc}px, 0) scale(${scale}) rotate(${rotate}deg)`;
      flyer.style.opacity = String(opacity);

      if (progress < 1) {
        window.requestAnimationFrame(animateFlyer);
      } else {
        flyer.remove();
      }
    };
    window.requestAnimationFrame(animateFlyer);

    cartTarget.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.16)' },
        { transform: 'scale(1)' },
      ],
      { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
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

    const cartItem: CartItem = {
      ...item,
      startDate,
      endDate,
      startTime,
      endTime,
      rentalBillingMode,
      quantity: Math.max(1, Math.min(quantity, item.stock || 1)),
    };

    addToCart(cartItem);

    if (cart[0]?.store_id && cart[0].store_id !== item.store_id) {
      return;
    }
    
    triggerCartAnimation(item, event.currentTarget);
    setCartNotice({ type: 'success', message: 'Added to cart!' });
    setTimeout(() => setCartNotice(null), 3000);
  };

  if (loading) return <div className="flex h-96 items-center justify-center">Loading item...</div>;
  if (!item) return <div>Item not found</div>;

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-8 lg:py-12">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <div>
          <div ref={productImageRef} className="mx-auto h-64 w-full overflow-hidden rounded-2xl border bg-muted sm:aspect-square sm:h-auto lg:sticky lg:top-20">
            <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/800/800`} className="h-full w-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="mb-1 text-2xl font-black leading-tight text-[var(--tone-text)] sm:text-4xl">{item.name}</h1>
            <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">{item.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Brand: {item.brand || 'Others'} {item.category ? `| Category: ${item.category}` : ''}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Daily Rate</p>
                <p className="text-2xl font-black sm:text-3xl">{formatPHP(item.daily_price)}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {selectedRentalDays} billing day{selectedRentalDays === 1 ? '' : 's'} by {rentalBillingModeLabel} ({formatPHP(item.daily_price * selectedRentalDays)})
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Available Stock</p>
                <p className="text-lg font-black">{Math.max(0, item.stock || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--tone-text)]">Start Date</label>
                <Input
                  type="date"
                  className="h-10 rounded-lg text-xs sm:h-11"
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
                <label className="text-xs font-bold text-[var(--tone-text)]">End Date</label>
                <Input
                  type="date"
                  className="h-10 rounded-lg text-xs sm:h-11"
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
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--tone-text)]">Start Time</label>
                <Input
                  type="time"
                  className="h-10 rounded-lg text-xs sm:h-11"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setCartNotice(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--tone-text)]">End Time</label>
                <Input
                  type="time"
                  className="h-10 rounded-lg text-xs sm:h-11"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setCartNotice(null);
                  }}
                />
              </div>
            </div>
            <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-blue-900 sm:text-xs">
              {rentalBillingMode === 'calendar_day'
                ? 'This shop charges by calendar day. Each selected calendar date counts as one billing day.'
                : 'This shop charges by 24-hour period from the selected start date/time to end date/time.'}
            </p>
            {!isBefore(selectedStartDateTime, selectedEndDateTime) ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-900">End time must be after start time.</div>
            ) : null}
            {selectedOverlap ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-900">
                Selected dates overlap with {selectedOverlap.type === 'booking' ? `a ${selectedOverlap.status.toLowerCase().replace(/_/g, ' ')} booking` : 'a blocked date'}.
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-[var(--tone-text)]">Quantity</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                  -
                </Button>
                <div className="min-w-12 rounded-md border px-3 py-1.5 text-center text-sm font-semibold">{quantity}</div>
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
              <Button className="h-10 w-full rounded-xl text-sm font-black sm:h-12 sm:text-base" onClick={handleAddToCart} disabled={user?.role === 'owner' || item.is_available === false || (item.stock || 0) <= 0}>
                {user?.role === 'owner' ? 'Owners Cannot Rent' : item.is_available === false || (item.stock || 0) <= 0 ? 'Currently Unavailable' : 'Add to Cart'}
              </Button>
              
              {cartNotice && (
                <div className={cn(
                  "rounded-lg border p-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 sm:p-3 sm:text-sm",
                  cartNotice.type === 'success' ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-900 border-red-200"
                )}>
                  {cartNotice.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold sm:text-base">
              <CalendarIcon className="h-5 w-5" />
              Availability Calendar
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">Availability by date. Pricing is based on {rentalBillingModeLabel}.</p>
            <div className="rounded-2xl border bg-muted/30 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap gap-2 text-[10px] sm:gap-4 sm:text-xs">
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

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={`${day}-${index}`} className="p-1 font-bold">
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
                        'min-h-7 rounded-md border p-1 text-muted-foreground sm:min-h-9 sm:p-2',
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
