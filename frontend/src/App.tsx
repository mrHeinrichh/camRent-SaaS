import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from '@/src/components/layout/Navbar';
import { siteTheme } from '@/src/config/siteTheme';
import { useAppStore } from '@/src/store';
import { api } from '@/src/lib/api';
import type { SiteContent } from '@/src/types/domain';
import { defaultSiteContent, mergeSiteContent } from '@/src/config/siteContentDefaults';
import { AccountPage } from '@/src/pages/AccountPage';
import { AdminDashboardPage } from '@/src/pages/AdminDashboardPage';
import { CartPage } from '@/src/pages/CartPage';
import { CheckoutPage } from '@/src/pages/CheckoutPage';
import { HomePage } from '@/src/pages/HomePage';
import { ItemPage } from '@/src/pages/ItemPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { OwnerDashboardPage } from '@/src/pages/OwnerDashboardPage';
import { AboutPage } from '@/src/pages/AboutPage';
import { DonatePage } from '@/src/pages/DonatePage';
import { PoliciesPage } from '@/src/pages/PoliciesPage';
import { StorePage } from '@/src/pages/StorePage';
import { SuccessPage } from '@/src/pages/SuccessPage';

export default function App() {
  const { page, user, selectedStoreId, selectedItemId, setPage, openStore, openItem } = useAppStore();
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent as any);

  useEffect(() => {
    if (user?.role === 'owner' && page !== 'owner' && page !== 'login') {
      setPage('owner');
    }
  }, [page, setPage, user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tone-bg', siteTheme.palette.bg);
    root.style.setProperty('--tone-surface', siteTheme.palette.surface);
    root.style.setProperty('--tone-surface-soft', siteTheme.palette.surfaceSoft);
    root.style.setProperty('--tone-border', siteTheme.palette.border);
    root.style.setProperty('--tone-text', siteTheme.palette.text);
    root.style.setProperty('--tone-text-muted', siteTheme.palette.textMuted);
    root.style.setProperty('--tone-accent', siteTheme.palette.accent);
    root.style.setProperty('--tone-accent-text', siteTheme.palette.accentText);
    root.style.setProperty('--tone-nav', siteTheme.palette.nav);
    root.style.setProperty('--tone-nav-border', siteTheme.palette.navBorder);
  }, []);

  useEffect(() => {
    api
      .get<SiteContent>('/api/site-content')
      .then((data) => setSiteContent(mergeSiteContent(defaultSiteContent as any, data as any)))
      .catch(() => setSiteContent(defaultSiteContent as any));
  }, []);

  const navigateToStore = (id: string) => {
    if (user?.role === 'owner') return;
    openStore(id);
  };

  const navigateToItem = (id: string) => {
    if (user?.role === 'owner') return;
    openItem(id);
  };

  return (
    <div className="min-h-screen bg-[var(--tone-bg)] font-sans antialiased">
      <Navbar onNavigate={setPage} />

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {page === 'home' && <HomePage onNavigate={navigateToStore} content={siteContent} />}
            {page === 'about' && <AboutPage onNavigate={setPage} />}
            {page === 'policies' && <PoliciesPage onNavigate={setPage} content={siteContent} />}
            {page === 'donate' && <DonatePage onNavigate={setPage} content={siteContent} />}
            {page === 'store' && selectedStoreId && <StorePage storeId={selectedStoreId} onNavigateItem={navigateToItem} />}
            {page === 'item' && selectedItemId && <ItemPage itemId={selectedItemId} />}
            {page === 'cart' && <CartPage onCheckout={() => setPage('checkout')} />}
            {page === 'checkout' && <CheckoutPage onComplete={() => setPage('success')} onNavigate={setPage} />}
            {page === 'account' && <AccountPage onNavigate={setPage} />}
            {page === 'success' && <SuccessPage onBackHome={() => setPage('home')} onOpenAccount={() => setPage('account')} />}
            {page === 'login' && <LoginPage onNavigate={setPage} content={siteContent} />}
            {page === 'owner' && <OwnerDashboardPage />}
            {page === 'admin' && <AdminDashboardPage />}
            {page !== 'home' &&
              page !== 'about' &&
              page !== 'policies' &&
              page !== 'donate' &&
              page !== 'store' &&
              page !== 'item' &&
              page !== 'cart' &&
              page !== 'checkout' &&
              page !== 'account' &&
              page !== 'success' &&
              page !== 'login' &&
              page !== 'owner' &&
              page !== 'admin' && (
                <div className="container mx-auto px-4 py-16 text-center">
                  <h1 className="text-2xl font-bold text-[var(--tone-text)]">Page Not Available</h1>
                  <p className="mt-2 text-sm text-[var(--tone-text-muted)]">This route is not available as of the moment. Please return to the homepage.</p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-md border border-[var(--tone-border)] bg-[var(--tone-surface)] px-4 py-2 text-sm font-medium text-[var(--tone-text)] hover:bg-[var(--tone-surface-soft)]"
                    onClick={() => setPage('home')}
                  >
                    Back to Home
                  </button>
                </div>
              )}
            {(page === 'store' && !selectedStoreId) || (page === 'item' && !selectedItemId) ? (
              <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-[var(--tone-text)]">Page Not Available</h1>
                <p className="mt-2 text-sm text-[var(--tone-text-muted)]">This route is not available as of the moment. Please return to the homepage.</p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center rounded-md border border-[var(--tone-border)] bg-[var(--tone-surface)] px-4 py-2 text-sm font-medium text-[var(--tone-text)] hover:bg-[var(--tone-surface-soft)]"
                  onClick={() => setPage('home')}
                >
                  Back to Home
                </button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
