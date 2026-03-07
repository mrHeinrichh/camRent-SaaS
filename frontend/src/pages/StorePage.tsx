import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { Item, Store } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

interface StorePageProps {
  storeId: string;
  onNavigateItem: (id: string) => void;
}

export function StorePage({ storeId, onNavigateItem }: StorePageProps) {
  const [store, setStore] = useState<(Store & { items: Item[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner') return;

    api
      .get<Store & { items: Item[] }>(`/api/stores/${storeId}`)
      .then(setStore)
      .finally(() => setLoading(false));
  }, [storeId, user]);

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading store...</div>;
  if (!store) return <div>Store not found</div>;

  return (
    <div className="pb-20">
      <div className="relative h-64 overflow-hidden md:h-80">
        <img
          src={store.banner_url || `https://picsum.photos/seed/banner-${store.id}/1920/600`}
          className="h-full w-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
          <div className="container mx-auto flex items-end gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl md:h-32 md:w-32">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/200/200`} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="mb-2">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">{store.name}</h1>
              <p className="max-w-xl line-clamp-2 text-white/80">{store.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-12 px-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full space-y-6 md:w-64">
            <div>
              <h4 className="mb-3 font-semibold">Categories</h4>
              <div className="space-y-1">
                {['All Gear', 'Cameras', 'Lenses', 'Lighting', 'Audio', 'Gimbals'].map((category) => (
                  <Button key={category} variant="ghost" className="w-full justify-start font-normal">
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Equipment</h2>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {store.address}
                </div>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search gear..." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {store.items.map((item) => (
                <Card key={item.id} className="group cursor-pointer overflow-hidden" onClick={() => onNavigateItem(item.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image_url || `https://picsum.photos/seed/item-${item.id}/400/400`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 font-bold">{item.name}</h3>
                    <p className="mb-4 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">${item.daily_price}</span>
                        <span className="text-xs text-muted-foreground"> / day</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
