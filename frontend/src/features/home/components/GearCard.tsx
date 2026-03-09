import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPHP } from '@/src/lib/currency';
import type { GearFeedItem } from '@/src/features/home/types';
import { Button, Card } from '@/src/components/ui';

interface GearCardProps {
  gear: GearFeedItem;
  onOpenStore: (storeId: string) => void;
  onAddToCart: (gear: GearFeedItem) => void;
}

export function GearCard({ gear, onOpenStore, onAddToCart }: GearCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="group overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={gear.image_url || `https://picsum.photos/seed/item-${gear.id}/800/450`}
            alt={gear.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-sm font-medium backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {Number(gear.store.rating || 0).toFixed(1)}
          </div>
        </div>

        <div className="p-5">
          <h3 className="mb-1 text-lg font-bold">{gear.name}</h3>
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{gear.description || 'No description provided.'}</p>
          <p className="mb-4 text-xs text-muted-foreground">
            {gear.category || 'Uncategorized'} • {gear.brand || 'Others'} • Stock: {Math.max(0, Number(gear.stock || 0))}
          </p>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
              <img src={gear.store.logo_url || `https://picsum.photos/seed/logo-${gear.store.id}/100/100`} alt="" referrerPolicy="no-referrer" />
            </div>
            <button className="text-left text-sm font-semibold hover:underline" onClick={() => onOpenStore(gear.store.id)}>
              {gear.store.name}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">{formatPHP(Number(gear.daily_price || 0))}</p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
            <Button className="gap-2" onClick={() => onAddToCart(gear)}>
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
