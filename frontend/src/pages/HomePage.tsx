import { useEffect, useState } from 'react';
import { ChevronRight, MapPin, Search, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { Store } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

interface HomePageProps {
  onNavigate: (id: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner') return;

    api
      .get<Store[]>('/api/stores')
      .then(setStores)
      .finally(() => setLoading(false));
  }, [user]);

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading stores...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Rent Professional Gear <br /> from Local Stores
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          The easiest way to find and rent cameras, lenses, and production equipment.
        </p>
      </div>

      <div className="mb-8 mx-auto max-w-md relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search stores..." />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <motion.div key={store.id} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="group cursor-pointer overflow-hidden" onClick={() => onNavigate(store.id)}>
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={store.banner_url || `https://picsum.photos/seed/store-${store.id}/800/450`}
                  alt={store.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-sm font-medium backdrop-blur">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {store.rating || '4.8'}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
                    <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="text-lg font-bold">{store.name}</h3>
                </div>

                <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {store.address || 'Downtown, City Center'}
                </div>

                <Button className="w-full group-hover:bg-primary/90">
                  Visit Store
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
