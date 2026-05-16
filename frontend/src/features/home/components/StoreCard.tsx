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
    <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-1 hover:[transform:rotateX(1deg)_rotateY(2deg)_translateZ(8px)] sm:rounded-2xl" onClick={() => onOpenStore(store.id)}>
        <div className="relative aspect-square overflow-hidden sm:aspect-[16/11]">
          <img
            src={store.banner_url || `https://picsum.photos/seed/store-${store.id}/800/450`}
            alt={store.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-900 backdrop-blur sm:right-2 sm:top-2 sm:gap-1 sm:px-2 sm:py-1 sm:text-xs">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 sm:h-3.5 sm:w-3.5" />
            {Number(store.rating || 0).toFixed(1)}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-2.5 sm:p-4">
          <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-3">
            <div className="h-6 w-6 overflow-hidden rounded-full border bg-slate-50 sm:h-10 sm:w-10">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
            </div>
            <h3 className="line-clamp-2 text-xs font-extrabold leading-tight text-slate-900 sm:text-base">{store.name}</h3>
          </div>
          <div className="mb-2 flex items-start gap-1 text-[10px] text-slate-500 sm:mb-3 sm:text-xs">
            <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
            <span className="line-clamp-2">{store.address || 'Downtown, City Center'}</span>
          </div>
          <p className="mb-3 hidden text-xs leading-relaxed text-slate-500 sm:line-clamp-2 sm:block">{store.description || 'No store description provided.'}</p>
          <Button className="mt-auto h-8 w-full rounded-full bg-[var(--tone-accent)] px-2 text-[11px] text-[var(--tone-accent-text)] hover:opacity-90 sm:h-9 sm:text-sm">
            Visit Store
            <ChevronRight className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
