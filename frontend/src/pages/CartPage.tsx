import { useState } from 'react';
import { Calendar as CalendarIcon, Minus, Plus, ReceiptText, ShoppingCart, TicketPercent, Trash2 } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { getCartItemRentalTotal, getRentalBillingModeLabel, getRentalDayCount } from '@/src/lib/rentalPricing';
import { Button, Card, cn } from '@/src/components/ui';
import { useAppStore } from '@/src/store';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { cart, removeFromCartAtIndex, updateCartQuantity, user, appliedVoucher, setAppliedVoucher } = useAppStore();
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherBusy, setVoucherBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  const rentalSubtotal = cart.reduce((sum, item) => sum + getCartItemRentalTotal(item), 0);
  const voucherDiscount = appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? Math.max(0, Number(appliedVoucher.discount_amount || 0)) : 0;
  const finalTotal = Math.max(0, rentalSubtotal - voucherDiscount);
  const handleCheckout = () => {
    if (checkoutBusy) return;
    setCheckoutBusy(true);
    onCheckout();
    setTimeout(() => setCheckoutBusy(false), 600);
  };

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
    <div className="container mx-auto px-3 py-5 sm:px-4 sm:py-10 lg:pb-10">
      <div className="mb-4 text-left sm:mb-8 sm:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 sm:text-xs sm:tracking-[0.3em]">CamRent PH</p>
        <h1 className="mt-1 text-xl font-black text-slate-900 sm:mt-2 sm:text-4xl">Rental Cart</h1>
        <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">Review dates, quantity, voucher, and checkout.</p>
      </div>
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-950 sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
        This shop uses {getRentalBillingModeLabel(cart[0]?.rentalBillingMode)} for rental billing.
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="no-3d space-y-3 lg:col-span-2">
          {cart.map((item, index) => (
            <Card
              key={`${item.id}-${item.startDate}-${item.startTime || ''}-${item.endDate}-${item.endTime || ''}-${index}`}
              className="i3d-card rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
            >
              <div className="flex gap-3 sm:gap-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border bg-slate-50 sm:h-24 sm:w-24">
                  <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/200/200`} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="line-clamp-2 min-h-[2.25rem] flex-1 text-sm font-semibold leading-snug text-slate-900 sm:min-h-0 sm:text-base">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      title="Remove item"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFromCartAtIndex(index);
                      }}
                      className="pointer-events-auto h-8 w-8 shrink-0 rounded-full text-destructive hover:bg-red-50 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-slate-500 sm:text-xs">
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.startDate} {item.startTime || '09:00'} to {item.endDate} {item.endTime || '18:00'}</span>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900 sm:text-base">{formatPHP(getCartItemRentalTotal(item))}</p>
                      <p className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">
                        {getRentalDayCount(item)} billing day{getRentalDayCount(item) === 1 ? '' : 's'} | {getRentalBillingModeLabel(item.rentalBillingMode)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 shadow-inner">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Decrease quantity"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateCartQuantity(item.id, item.startDate, item.endDate, Math.max(1, (item.quantity || 1) - 1), item.startTime, item.endTime);
                        }}
                        className="h-7 w-7 rounded-full bg-white p-0 shadow-sm hover:bg-slate-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-6 text-center text-sm font-black text-slate-900">{Math.max(1, item.quantity || 1)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Increase quantity"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateCartQuantity(
                            item.id,
                            item.startDate,
                            item.endDate,
                            Math.min(Math.max(1, item.stock || 1), Math.max(1, (item.quantity || 1) + 1)),
                            item.startTime,
                            item.endTime,
                          );
                        }}
                        className="h-7 w-7 rounded-full bg-white p-0 shadow-sm hover:bg-slate-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="i3d-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ReceiptText className="h-4 w-4" /> Order Summary
            </h3>
            <div className="mb-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <TicketPercent className="h-3 w-3" /> Voucher
              </p>
              <p className="text-xs text-slate-500">Voucher only works on the store who generates it.</p>
              <div className="flex gap-2">
                <input
                  className={cn(
                    "h-10 w-full rounded-full border bg-white px-4 text-sm outline-none transition-all focus:ring-4",
                    voucherError ? "border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-[var(--tone-accent)] focus:ring-[var(--tone-accent)]/10"
                  )}
                  placeholder="Enter voucher code"
                  value={voucherCodeInput}
                  onChange={(event) => {
                    setVoucherCodeInput(event.target.value.toUpperCase());
                    setVoucherError('');
                    setVoucherSuccess('');
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={voucherBusy}
                  className="rounded-full h-10 px-6 font-bold"
                  onClick={async () => {
                    setVoucherError('');
                    setVoucherSuccess('');
                    if (!user) return setVoucherError('Login as renter to apply voucher.');
                    const storeId = cart[0]?.store_id;
                    if (!storeId) return setVoucherError('Cart store is missing');
                    const code = voucherCodeInput.trim().toUpperCase();
                    if (!code) return setVoucherError('Enter voucher code');
                    try {
                      setVoucherBusy(true);
                      const result = await api.post<{ success: boolean; voucher: { code: string; discount_amount: number; store_id: string; note: string } }>('/api/orders/voucher/validate', {
                        store_id: storeId,
                        code,
                      });
                      setAppliedVoucher(result.voucher);
                      setVoucherSuccess(result.voucher.note || 'Voucher applied successfully!');
                    } catch (error: any) {
                      setVoucherError(error.message || 'Failed to apply voucher');
                    } finally {
                      setVoucherBusy(false);
                    }
                  }}
                >
                  Apply
                </Button>
              </div>
              {voucherError && <p className="mt-2 ml-1 text-xs font-bold text-red-500 animate-fade-up">{voucherError}</p>}
              {voucherSuccess && <p className="mt-2 ml-1 text-xs font-bold text-emerald-600 animate-fade-up">{voucherSuccess}</p>}
              {appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? (
                <p className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center justify-between">
                  <span>Applied: <span className="font-bold">{appliedVoucher.code}</span> (-{formatPHP(appliedVoucher.discount_amount)})</span>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest underline hover:text-emerald-900" onClick={() => { setAppliedVoucher(null); setVoucherSuccess(''); }}>
                    Remove
                  </button>
                </p>
              ) : null}
            </div>
            <div className="mb-6 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Rental Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPHP(rentalSubtotal)}</span>
              </div>
              {voucherDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Voucher Discount</span>
                  <span className="font-semibold">-{formatPHP(voucherDiscount)}</span>
                </div>
              ) : null}
              <div className="mt-3 flex justify-between rounded-xl bg-white px-3 py-2 text-base font-semibold text-slate-900">
                <span>Total Due</span>
                <span>{formatPHP(finalTotal)}</span>
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-full"
              onClick={handleCheckout}
              disabled={checkoutBusy}
            >
              {checkoutBusy ? 'Opening Checkout...' : 'Proceed to Checkout'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
