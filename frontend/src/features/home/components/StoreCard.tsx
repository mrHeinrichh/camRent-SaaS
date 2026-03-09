import { ChevronRight, MapPin, Star } from 'lucide-react';
import { motion } from 'motion/react';
import type { Store } from '@/src/types/domain';
import { Button, Card } from '@/src/components/ui';

interface StoreCardProps {
  store: Store;
  onOpenStore: (storeId: string) => void;
}

export function StoreCard({ store, onOpenStore }: StoreCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="group cursor-pointer overflow-hidden" onClick={() => onOpenStore(store.id)}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={store.banner_url || `https://picsum.photos/seed/store-${store.id}/800/450`}
            alt={store.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-sm font-medium backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {Number(store.rating || 0).toFixed(1)}
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
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{store.description || 'No store description provided.'}</p>
          <Button className="w-full group-hover:bg-primary/90">
            Visit Store
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
