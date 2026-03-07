import { Calendar as CalendarIcon, ShoppingCart } from 'lucide-react';
import { Button, Card } from '@/src/components/ui';
import { useAppStore } from '@/src/store';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { cart, removeFromCart, user } = useAppStore();
  const rentalSubtotal = cart.reduce((sum, item) => sum + item.daily_price, 0);
  const deposits = cart.reduce((sum, item) => sum + item.deposit_amount, 0);

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
                  <span className="text-sm font-medium">Daily: ${item.daily_price}</span>
                  <span className="text-sm font-medium">Deposit: ${item.deposit_amount}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold">Order Summary</h3>
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rental Subtotal</span>
                <span>${rentalSubtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Security Deposits</span>
                <span>${deposits}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total Due</span>
                <span>${rentalSubtotal + deposits}</span>
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
