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
      <Card className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border-[var(--tone-border)] bg-[var(--tone-surface-soft)] shadow-sm sm:rounded-2xl" onClick={() => onOpenStore(store.id)}>
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-video">
          <img
            src={store.banner_url || `https://picsum.photos/seed/store-${store.id}/800/450`}
            alt={store.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-[var(--tone-panel-overlay)]/90 px-2 py-1 text-[10px] font-medium text-[var(--tone-text)] backdrop-blur sm:right-4 sm:top-4 sm:text-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 sm:h-3.5 sm:w-3.5" />
            {Number(store.rating || 0).toFixed(1)}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-5">
          <div className="mb-2 flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full border bg-muted sm:h-10 sm:w-10">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
            </div>
            <h3 className="line-clamp-1 text-sm font-bold text-[var(--tone-text)] sm:text-lg">{store.name}</h3>
          </div>
          <div className="mb-3 flex items-center gap-1 text-[11px] text-muted-foreground sm:mb-4 sm:text-sm">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{store.address || 'Downtown, City Center'}</span>
          </div>
          <p className="mb-4 line-clamp-2 text-[10px] text-muted-foreground sm:text-xs">{store.description || 'No store description provided.'}</p>
          <Button className="mt-auto h-8 w-full bg-[var(--tone-accent)] text-xs text-[var(--tone-accent-text)] hover:opacity-90 sm:h-9 sm:text-sm">
            Visit Store
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
