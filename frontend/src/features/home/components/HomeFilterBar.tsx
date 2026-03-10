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
    <div className="mb-8 grid grid-cols-1 gap-2 rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface)] p-3 sm:flex sm:flex-wrap sm:items-center">
      <Button
        variant={viewMode === 'gears' ? 'secondary' : 'outline'}
        className={`w-full sm:w-auto ${viewMode === 'gears' ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
        onClick={() => onViewModeChange('gears')}
      >
        Gears
      </Button>
      <Button
        variant={viewMode === 'stores' ? 'secondary' : 'outline'}
        className={`w-full sm:w-auto ${viewMode === 'stores' ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
        onClick={() => onViewModeChange('stores')}
      >
        Stores
      </Button>
      <Button variant="outline" className="w-full border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)] sm:w-auto" onClick={onClearSearch}>
        Clear Search
      </Button>
      {viewMode === 'gears' ? (
        <>
          <select className="w-full rounded-md border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] sm:w-auto" value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            className="h-10 w-full rounded-md border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] sm:w-auto"
            list="homepage-brand-options"
            placeholder="Brand (choose or type custom)"
            value={selectedBrand}
            onChange={(event) => onBrandChange(event.target.value)}
            onFocus={() => {
              const normalized = selectedBrand.toLowerCase().replace(/\s+/g, '');
              if (normalized === 'allbrands') onBrandChange('');
            }}
            onBlur={(event) => {
              if (!event.target.value.trim()) onBrandChange('All Brands');
            }}
          />
          <datalist id="homepage-brand-options">
            {BRAND_OPTIONS.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </>
      ) : (
        <select className="w-full rounded-md border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] sm:w-auto" value={sortMode} onChange={(event) => onSortModeChange(event.target.value as SortMode)}>
          <option value="default">Show all stores</option>
          <option value="store_az">Store name A-Z</option>
          <option value="store_za">Store name Z-A</option>
        </select>
      )}
      <select className="w-full rounded-md border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] sm:w-auto" value={minRating} onChange={(event) => onMinRatingChange(event.target.value)}>
        <option value="0">Filter by ratings</option>
        <option value="4.5">4.5+</option>
        <option value="4">4.0+</option>
        <option value="3.5">3.5+</option>
        <option value="3">3.0+</option>
      </select>
      <Button
        variant={nearMeOnly ? 'secondary' : 'outline'}
        className={`w-full sm:w-auto ${nearMeOnly ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
        onClick={onToggleNearMe}
      >
        <MapPin className="mr-2 h-4 w-4" /> {locating ? 'Getting location...' : nearMeOnly ? 'Near me: ON' : 'Near me'}
      </Button>
    </div>
  );
}
