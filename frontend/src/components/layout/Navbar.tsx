import { Camera, LogOut, ShoppingCart, User } from 'lucide-react';
import { Button } from '@/src/components/ui';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';

interface NavbarProps {
  onNavigate: (page: AppPage) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { user, cart, logout } = useAppStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex cursor-pointer items-center gap-2" onClick={() => (user?.role === 'owner' ? onNavigate('owner') : onNavigate('home'))}>
          <Camera className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">CamRent</span>
        </div>

        <div className="flex items-center gap-4">
          {user?.role !== 'owner' && user?.role !== 'admin' && (
            <Button variant="ghost" size="icon" onClick={() => onNavigate('cart')} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {cart.length}
                </span>
              )}
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onNavigate(user.role === 'admin' ? 'admin' : user.role === 'owner' ? 'owner' : 'account')}>
                <User className="mr-2 h-4 w-4" />
                {user.role === 'owner' ? 'Dashboard' : 'My Account'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => onNavigate('login')}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
