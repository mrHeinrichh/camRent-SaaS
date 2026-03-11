import { Camera, LogOut, Search, ShoppingCart, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Button, Input } from '@/src/components/ui';
import { siteTheme } from '@/src/config/siteTheme';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';

interface NavbarProps {
  onNavigate: (page: AppPage) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { user, cart, logout, page, homeSearchQuery, setHomeSearchQuery } = useAppStore();
  const [cartBump, setCartBump] = useState(false);
  const lastCartCountRef = useRef(cart.length);
  const showHomeSearch = page === 'home' && user?.role !== 'owner' && user?.role !== 'admin';

  useEffect(() => {
    if (cart.length > lastCartCountRef.current) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 300);
      lastCartCountRef.current = cart.length;
      return () => clearTimeout(timer);
    }
    lastCartCountRef.current = cart.length;
  }, [cart.length]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--tone-nav-border)] bg-[var(--tone-nav)]">
      <div className="container relative mx-auto px-4 py-2">
        <div className="flex h-12 items-center justify-between gap-3">
          <div className="flex min-w-0 cursor-pointer items-center gap-2" onClick={() => (user?.role === 'owner' ? onNavigate('owner') : onNavigate('home'))}>
            <Camera className="h-6 w-6 shrink-0 text-[var(--tone-text)]" />
            <span className="truncate text-base font-bold tracking-tight text-[var(--tone-text)] sm:text-xl">{siteTheme.brandName}</span>
          </div>

          {showHomeSearch ? (
            <div className="pointer-events-none absolute left-1/2 z-10 hidden w-full max-w-xl -translate-x-1/2 px-4 md:block">
              <div className="pointer-events-auto relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="border-[var(--tone-border)] bg-white pl-9" placeholder="Search gears, brands, stores..." value={homeSearchQuery} onChange={(event) => setHomeSearchQuery(event.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 sm:gap-4">
            {user?.role !== 'owner' && user?.role !== 'admin' && (
              <Button variant="ghost" size="icon" onClick={() => onNavigate('cart')} className="relative">
                <motion.span animate={{ scale: cartBump ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <ShoppingCart className="h-5 w-5" />
                </motion.span>
                {cart.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {cart.length}
                  </span>
                )}
              </Button>
            )}

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => onNavigate(user.role === 'admin' ? 'admin' : user.role === 'owner' ? 'owner' : 'account')}>
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{user.role === 'owner' ? 'Dashboard' : 'My Account'}</span>
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

        {showHomeSearch ? (
          <div className="mt-2 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border-[var(--tone-border)] bg-white pl-9" placeholder="Search gears, brands, stores..." value={homeSearchQuery} onChange={(event) => setHomeSearchQuery(event.target.value)} />
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
