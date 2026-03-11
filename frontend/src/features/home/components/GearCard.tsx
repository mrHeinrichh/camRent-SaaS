import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPHP } from '@/src/lib/currency';
import type { GearFeedItem } from '@/src/features/home/types';
import { Button, Card } from '@/src/components/ui';

interface GearCardProps {
  gear: GearFeedItem;
  onOpenStore: (storeId: string) => void;
  onAddToCart: (gear: GearFeedItem) => void;
  justAdded?: boolean;
}

export function GearCard({ gear, onOpenStore, onAddToCart, justAdded }: GearCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-1 hover:[transform:rotateX(1deg)_rotateY(-2deg)_translateZ(8px)]">
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-video">
          <img
            src={gear.image_url || `https://picsum.photos/seed/item-${gear.id}/800/450`}
            alt={gear.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-900 backdrop-blur sm:right-4 sm:top-4 sm:text-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 sm:h-3.5 sm:w-3.5" />
            {Number(gear.store.rating || 0).toFixed(1)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="mb-1 line-clamp-1 text-sm font-extrabold text-slate-900 sm:text-lg">{gear.name}</h3>
          <p className="mb-2 line-clamp-2 text-[11px] text-slate-500 sm:text-sm">{gear.description || 'No description provided.'}</p>
          <p className="mb-3 line-clamp-1 text-[10px] text-slate-500 sm:mb-4 sm:text-xs">
            {gear.category || 'Uncategorized'} • {gear.brand || 'Others'} • Stock: {Math.max(0, Number(gear.stock || 0))}
          </p>
          <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-1">
            <div className="h-8 w-8 overflow-hidden rounded-full border bg-slate-50 sm:h-10 sm:w-10">
              <img src={gear.store.logo_url || `https://picsum.photos/seed/logo-${gear.store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
            </div>
            <button className="line-clamp-1 text-left text-xs font-semibold text-slate-900 hover:underline sm:text-sm" onClick={() => onOpenStore(gear.store.id)}>
              {gear.store.name}
            </button>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900 sm:text-base">{formatPHP(Number(gear.daily_price || 0))}</p>
              <p className="text-[10px] text-slate-500 sm:text-xs">per day</p>
            </div>
            <Button
              className={`h-8 gap-2 rounded-full text-xs sm:h-9 sm:text-sm ${justAdded ? 'bg-emerald-500 text-white' : 'bg-[var(--tone-accent)] text-[var(--tone-accent-text)] hover:opacity-90'}`}
              onClick={() => onAddToCart(gear)}
            >
              <ShoppingCart className={`h-4 w-4 ${justAdded ? 'animate-bounce' : ''}`} /> {justAdded ? 'Added' : 'Add'}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
