import { useState, type FormEvent } from 'react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import { Button, Card, Input } from '@/src/components/ui';

interface CheckoutPageProps {
  onComplete: () => void;
  onNavigate?: (page: AppPage) => void;
}

export function CheckoutPage({ onComplete, onNavigate }: CheckoutPageProps) {
  const { cart, clearCart, user } = useAppStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    deliveryMode: 'pickup',
    deliveryAddress: '',
    paymentMode: 'cash',
    agree: false,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return alert('Please login first before submitting a rental application.');
    if (!formData.agree) return alert('Please agree to the terms');

    try {
      await api.post('/api/orders', {
        store_id: cart[0].store_id,
        renter_name: formData.fullName,
        renter_email: formData.email,
        renter_phone: formData.phone,
        renter_address: formData.address,
        delivery_mode: formData.deliveryMode,
        delivery_address: formData.deliveryAddress || formData.address,
        payment_mode: formData.paymentMode,
        items: cart,
        total_amount: cart.reduce((sum, item) => sum + item.daily_price + item.deposit_amount, 0),
      });
      clearCart();
      onComplete();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Rental Agreement Form</h1>
          <p className="text-muted-foreground">Complete your application for review.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You need to login as a renter to submit checkout.
              {onNavigate && (
                <button type="button" className="ml-2 font-semibold underline" onClick={() => onNavigate('login')}>
                  Go to login
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Number</label>
              <Input required value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              disabled={Boolean(user?.email)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Mode</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.deliveryMode} onChange={(event) => setFormData({ ...formData, deliveryMode: event.target.value })}>
              <option value="pickup">Store Pickup</option>
              <option value="same_day">Same-day Delivery</option>
              <option value="scheduled">Scheduled Delivery</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Mode</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.paymentMode} onChange={(event) => setFormData({ ...formData, paymentMode: event.target.value })}>
              <option value="cash">Cash on Pickup</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="card">Credit/Debit Card</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Documents (Mocked)</label>
            <div className="grid grid-cols-2 gap-2">
              {['ID Front', 'ID Back', 'Selfie w/ ID', 'Proof of Billing'].map((label) => (
                <div key={label} className="rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
            <input type="checkbox" className="mt-1" checked={formData.agree} onChange={(event) => setFormData({ ...formData, agree: event.target.checked })} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              I agree to the rental terms and conditions. My application will be reviewed by the store owner.
            </p>
          </div>

          <Button type="submit" className="h-12 w-full" disabled={!user}>
            Submit Application
          </Button>
        </form>
      </Card>
    </div>
  );
}
