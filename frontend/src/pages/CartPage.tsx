import { useState } from 'react';
import { Calendar as CalendarIcon, ShoppingCart } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { Button, Card } from '@/src/components/ui';
import { useAppStore } from '@/src/store';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { cart, removeFromCart, updateCartQuantity, user, appliedVoucher, setAppliedVoucher } = useAppStore();
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherBusy, setVoucherBusy] = useState(false);
  const rentalSubtotal = cart.reduce((sum, item) => sum + item.daily_price * Math.max(1, item.quantity || 1), 0);
  const voucherDiscount = appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? Math.max(0, Number(appliedVoucher.discount_amount || 0)) : 0;
  const finalTotal = Math.max(0, rentalSubtotal - voucherDiscount);

  if (user?.role === 'owner') return null;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
        <p className="mb-8 text-muted-foreground">Browse our stores to find the perfect gear for your next project.</p>
        <Button onClick={() => window.location.reload()}>Browse Stores</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Your Rental Cart</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item) => (
            <Card key={`${item.id}-${item.startDate}-${item.endDate}`} className="flex gap-4 p-4">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/200/200`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <h3 className="font-bold">{item.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-8 w-8 p-0 text-destructive">
                    &times;
                  </Button>
                </div>

                <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> {item.startDate} to {item.endDate}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-sm font-medium">Daily: {formatPHP(item.daily_price)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(item.id, item.startDate, item.endDate, Math.max(1, (item.quantity || 1) - 1))}
                    >
                      -
                    </Button>
                    <span className="text-sm font-medium">{Math.max(1, item.quantity || 1)}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateCartQuantity(
                          item.id,
                          item.startDate,
                          item.endDate,
                          Math.min(Math.max(1, item.stock || 1), Math.max(1, (item.quantity || 1) + 1)),
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold">Order Summary</h3>
            <div className="mb-4 space-y-2 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Voucher</p>
              <p className="text-xs text-muted-foreground">Voucher only works on the store who generates it.</p>
              <div className="flex gap-2">
                <input
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Enter voucher code"
                  value={voucherCodeInput}
                  onChange={(event) => setVoucherCodeInput(event.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={voucherBusy}
                  onClick={async () => {
                    if (!user) return alert('Login as renter to apply voucher.');
                    const storeId = cart[0]?.store_id;
                    if (!storeId) return alert('Cart store is missing');
                    const code = voucherCodeInput.trim().toUpperCase();
                    if (!code) return alert('Enter voucher code');
                    try {
                      setVoucherBusy(true);
                      const result = await api.post<{ success: boolean; voucher: { code: string; discount_amount: number; store_id: string; note: string } }>('/api/orders/voucher/validate', {
                        store_id: storeId,
                        code,
                      });
                      setAppliedVoucher(result.voucher);
                      alert(result.voucher.note || 'Voucher applied');
                    } catch (error: any) {
                      alert(error.message || 'Failed to apply voucher');
                    } finally {
                      setVoucherBusy(false);
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
              {appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? (
                <p className="text-xs text-emerald-700">
                  Applied: <span className="font-semibold">{appliedVoucher.code}</span> (-{formatPHP(appliedVoucher.discount_amount)})
                  <button type="button" className="ml-2 underline" onClick={() => setAppliedVoucher(null)}>
                    Remove
                  </button>
                </p>
              ) : null}
            </div>
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rental Subtotal</span>
                <span>{formatPHP(rentalSubtotal)}</span>
              </div>
              {voucherDiscount > 0 ? (
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Voucher Discount</span>
                  <span>-{formatPHP(voucherDiscount)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total Due</span>
                <span>{formatPHP(finalTotal)}</span>
              </div>
            </div>
            <Button className="h-12 w-full" onClick={onCheckout}>
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
