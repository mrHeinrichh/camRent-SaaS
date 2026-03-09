import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from '@/src/components/layout/Navbar';
import { useAppStore } from '@/src/store';
import { AccountPage } from '@/src/pages/AccountPage';
import { AdminDashboardPage } from '@/src/pages/AdminDashboardPage';
import { CartPage } from '@/src/pages/CartPage';
import { CheckoutPage } from '@/src/pages/CheckoutPage';
import { HomePage } from '@/src/pages/HomePage';
import { ItemPage } from '@/src/pages/ItemPage';
import { LoginPage } from '@/src/pages/LoginPage';
import { OwnerDashboardPage } from '@/src/pages/OwnerDashboardPage';
import { AboutPage } from '@/src/pages/AboutPage';
import { PoliciesPage } from '@/src/pages/PoliciesPage';
import { StorePage } from '@/src/pages/StorePage';
import { SuccessPage } from '@/src/pages/SuccessPage';

export default function App() {
  const { page, user, selectedStoreId, selectedItemId, setPage, openStore, openItem } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner' && page !== 'owner' && page !== 'login') {
      setPage('owner');
    }
  }, [page, setPage, user]);

  const navigateToStore = (id: string) => {
    if (user?.role === 'owner') return;
    openStore(id);
  };

  const navigateToItem = (id: string) => {
    if (user?.role === 'owner') return;
    openItem(id);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
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
            {page === 'home' && <HomePage onNavigate={navigateToStore} />}
            {page === 'about' && <AboutPage onNavigate={setPage} />}
            {page === 'policies' && <PoliciesPage onNavigate={setPage} />}
            {page === 'store' && selectedStoreId && <StorePage storeId={selectedStoreId} onNavigateItem={navigateToItem} />}
            {page === 'item' && selectedItemId && <ItemPage itemId={selectedItemId} />}
            {page === 'cart' && <CartPage onCheckout={() => setPage('checkout')} />}
            {page === 'checkout' && <CheckoutPage onComplete={() => setPage('success')} onNavigate={setPage} />}
            {page === 'account' && <AccountPage onNavigate={setPage} />}
            {page === 'success' && <SuccessPage onBackHome={() => setPage('home')} />}
            {page === 'login' && <LoginPage onNavigate={setPage} />}
            {page === 'owner' && <OwnerDashboardPage />}
            {page === 'admin' && <AdminDashboardPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
