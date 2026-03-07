import { useEffect, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { AlertCircle, Ban, CheckCircle2, FileDown, History, Package, RotateCcw, Clock, User } from 'lucide-react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { OrderHistory } from '@/src/types/domain';
import { Button, Card, cn } from '@/src/components/ui';

interface AccountPageProps {
  onNavigate: (page: AppPage) => void;
}

export function AccountPage({ onNavigate }: AccountPageProps) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, clearCart } = useAppStore();

  useEffect(() => {
    api
      .get<OrderHistory[]>('/api/account/orders')
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const handleReorder = (order: OrderHistory) => {
    clearCart();
    order.items.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        daily_price: item.daily_price,
        deposit_amount: 0,
        image_url: item.image_url,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        store_id: order.store_id,
      });
    });
    onNavigate('cart');
  };

  if (loading) return <div className="p-12 text-center">Loading account...</div>;

  const stats = {
    total: orders.length,
    active: orders.filter((order) => order.status === 'APPROVED' || order.status === 'ONGOING').length,
    pending: orders.filter((order) => order.status === 'PENDING_REVIEW').length,
    completed: orders.filter((order) => order.status === 'COMPLETED').length,
    cancelled: orders.filter((order) => order.status === 'CANCELLED' || order.status === 'CANCELLED_BY_OWNER').length,
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your rentals and order history.</p>
        </div>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Total Rentals', value: stats.total, icon: Package },
          { label: 'Active', value: stats.active, icon: Clock },
          { label: 'Pending', value: stats.pending, icon: AlertCircle },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Cancelled', value: stats.cancelled, icon: Ban },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <History className="h-5 w-5" /> Order History
      </h2>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 p-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">#{order.id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Date</p>
                  <p className="text-sm">{format(parseISO(order.created_at), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Store</p>
                  <p className="text-sm font-medium">{order.store_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-bold uppercase',
                    order.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'PENDING_REVIEW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'CANCELLED_BY_OWNER'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-muted text-muted-foreground',
                  )}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                      <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/100/100`} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.start_date} to {item.end_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${item.daily_price}</p>
                      <p className="text-[10px] text-muted-foreground">per day</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex gap-4">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => alert('Mock Agreement Download')}>
                    <FileDown className="mr-1 h-3 w-3" /> Agreement
                  </Button>
                  {order.status === 'COMPLETED' && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleReorder(order)}>
                      <RotateCcw className="mr-1 h-3 w-3" /> Reorder
                    </Button>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-bold">${order.total_amount}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
