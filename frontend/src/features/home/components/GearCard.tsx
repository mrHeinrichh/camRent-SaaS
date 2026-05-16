import { Eye, Star, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPHP } from '@/src/lib/currency';
import type { GearFeedItem } from '@/src/features/home/types';
import { Button, Card } from '@/src/components/ui';

interface GearCardProps {
  gear: GearFeedItem;
  onOpenStore: (storeId: string) => void;
  onOpenItem: (itemId: string) => void;
}

export function GearCard({ gear, onOpenStore, onOpenItem }: GearCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-1 hover:[transform:rotateX(1deg)_rotateY(-2deg)_translateZ(8px)] sm:rounded-2xl">
        <div className="relative aspect-square overflow-hidden sm:aspect-[16/11]">
          <img
            src={gear.image_url || `https://picsum.photos/seed/item-${gear.id}/800/450`}
            alt={gear.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-900 backdrop-blur sm:right-2 sm:top-2 sm:gap-1 sm:px-2 sm:py-1 sm:text-xs">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 sm:h-3.5 sm:w-3.5" />
            {Number(gear.store.rating || 0).toFixed(1)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-2.5 sm:p-4">
          <h3 className="mb-1.5 line-clamp-2 min-h-[2rem] text-xs font-extrabold leading-tight text-slate-900 sm:min-h-[2.4rem] sm:text-base">{gear.name}</h3>
          <p className="mb-3 hidden text-xs leading-relaxed text-slate-500 sm:line-clamp-2 sm:block">{gear.description || 'No description provided.'}</p>
          <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-full border bg-slate-50 sm:h-10 sm:w-10">
              <img src={gear.store.logo_url || `https://picsum.photos/seed/logo-${gear.store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
            </div>
            <button className="flex min-w-0 items-center gap-1 text-left text-[10px] font-semibold text-slate-900 hover:underline sm:text-sm" onClick={() => onOpenStore(gear.store.id)}>
              <Store className="hidden h-3 w-3 shrink-0 text-slate-500 sm:block" />
              <span className="truncate">{gear.store.name}</span>
            </button>
          </div>
          <div className="mt-auto grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-extrabold text-slate-900 sm:text-base">{formatPHP(Number(gear.daily_price || 0))}</p>
              <p className="text-[9px] text-slate-500 sm:text-xs">per day</p>
            </div>
            <Button
              className="h-8 w-full gap-1 rounded-full bg-[var(--tone-accent)] px-2 text-[11px] text-[var(--tone-accent-text)] hover:opacity-90 sm:h-9 sm:w-auto sm:gap-2 sm:text-sm"
              onClick={() => onOpenItem(gear.id)}
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> View
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
