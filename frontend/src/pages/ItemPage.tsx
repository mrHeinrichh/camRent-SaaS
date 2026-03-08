import { useEffect, useState } from 'react';
import { addDays, format, isWithinInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
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
  const [quantity, setQuantity] = useState(1);
  const { addToCart, user } = useAppStore();

  useEffect(() => {
    api
      .get<Item>(`/api/items/${itemId}`)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleAddToCart = () => {
    if (!item) return;
    if (user?.role === 'owner') return alert('Store owners cannot rent items.');
    if (item.is_available === false || (item.stock || 0) <= 0) return alert('This gear is currently unavailable.');

    addToCart({
      ...item,
      startDate,
      endDate,
      quantity: Math.max(1, Math.min(quantity, item.stock || 1)),
    });
    alert('Added to cart!');
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
          </div>

          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Rate</p>
                <p className="text-3xl font-bold">{formatPHP(item.daily_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Available Stock</p>
                <p className="font-semibold">{Math.max(0, item.stock || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} min={startDate} />
              </div>
            </div>

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

            <Button className="h-12 w-full text-lg" onClick={handleAddToCart} disabled={user?.role === 'owner' || item.is_available === false || (item.stock || 0) <= 0}>
              {user?.role === 'owner' ? 'Owners Cannot Rent' : item.is_available === false || (item.stock || 0) <= 0 ? 'Currently Unavailable' : 'Add to Cart'}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold">
              <CalendarIcon className="h-5 w-5" />
              Availability Calendar
            </h3>
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
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="p-1 font-bold">
                    {day}
                  </div>
                ))}

                {Array.from({ length: 31 }).map((_, index) => {
                  const day = index + 1;
                  const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
                  const booking = item.bookings?.find((entry) =>
                    isWithinInterval(parseISO(dateStr), { start: parseISO(entry.start_date), end: parseISO(entry.end_date) }),
                  );
                  const manualBlock = item.manualBlocks?.find((entry) =>
                    isWithinInterval(parseISO(dateStr), { start: parseISO(entry.start_date), end: parseISO(entry.end_date) }),
                  );

                  return (
                    <div
                      key={day}
                      className={cn(
                        'rounded-md border p-2 text-muted-foreground',
                        booking?.status === 'APPROVED'
                          ? 'border-red-600 bg-red-500 text-white'
                          : booking?.status === 'PENDING_REVIEW'
                            ? 'border-yellow-500 bg-yellow-400 text-yellow-900'
                            : manualBlock
                              ? 'border-gray-500 bg-gray-400 text-white'
                              : 'cursor-pointer bg-background hover:bg-muted',
                      )}
                    >
                      {day}
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
