import { MapPin } from 'lucide-react';
import { Button } from '@/src/components/ui';
import { BRAND_OPTIONS } from '@/src/features/home/constants';
import type { SortMode, ViewMode } from '@/src/features/home/types';

interface HomeFilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClearSearch: () => void;
  selectedCategory: string;
  availableCategories: string[];
  onCategoryChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  minRating: string;
  onMinRatingChange: (value: string) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  nearMeOnly: boolean;
  locating: boolean;
  onToggleNearMe: () => void;
}

export function HomeFilterBar({
  viewMode,
  onViewModeChange,
  onClearSearch,
  selectedCategory,
  availableCategories,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  minRating,
  onMinRatingChange,
  sortMode,
  onSortModeChange,
  nearMeOnly,
  locating,
  onToggleNearMe,
}: HomeFilterBarProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      <Button variant={viewMode === 'gears' ? 'secondary' : 'outline'} onClick={() => onViewModeChange('gears')}>
        Gears
      </Button>
      <Button variant={viewMode === 'stores' ? 'secondary' : 'outline'} onClick={() => onViewModeChange('stores')}>
        Stores
      </Button>
      <Button variant="outline" onClick={onClearSearch}>
        Clear Search
      </Button>
      {viewMode === 'gears' ? (
        <>
          <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            list="homepage-brand-options"
            placeholder="Brand (choose or type custom)"
            value={selectedBrand}
            onChange={(event) => onBrandChange(event.target.value)}
          />
          <datalist id="homepage-brand-options">
            {BRAND_OPTIONS.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </>
      ) : (
        <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={sortMode} onChange={(event) => onSortModeChange(event.target.value as SortMode)}>
          <option value="default">Show all stores</option>
          <option value="store_az">Store name A-Z</option>
          <option value="store_za">Store name Z-A</option>
        </select>
      )}
      <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={minRating} onChange={(event) => onMinRatingChange(event.target.value)}>
        <option value="0">Filter by ratings</option>
        <option value="4.5">4.5+</option>
        <option value="4">4.0+</option>
        <option value="3.5">3.5+</option>
        <option value="3">3.0+</option>
      </select>
      <Button variant={nearMeOnly ? 'secondary' : 'outline'} onClick={onToggleNearMe}>
        <MapPin className="mr-2 h-4 w-4" /> {locating ? 'Getting location...' : nearMeOnly ? 'Near me: ON' : 'Near me'}
      </Button>
    </div>
  );
}
