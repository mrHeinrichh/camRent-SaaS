import { MapPin, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/src/components/ui';
import { BRAND_OPTIONS } from '@/src/features/home/constants';
import type { SortMode, ViewMode } from '@/src/features/home/types';

interface HomeFilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery?: string;
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
  searchQuery = '',
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
  const activeFilterCount = [
    Boolean(searchQuery.trim()),
    viewMode === 'gears' && selectedCategory !== 'All Gear',
    viewMode === 'gears' && selectedBrand !== 'All Brands',
    minRating !== '0',
    nearMeOnly,
  ].filter(Boolean).length;

  return (
    <div className="mb-6 rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface)] p-3 shadow-sm sm:mb-8">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto,1fr] lg:items-center">
        <div className="grid grid-cols-2 rounded-xl bg-white p-1 shadow-inner sm:w-fit">
          <Button
            variant={viewMode === 'gears' ? 'secondary' : 'ghost'}
            className={`h-10 rounded-lg px-4 ${viewMode === 'gears' ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
            onClick={() => onViewModeChange('gears')}
          >
            Gears
          </Button>
          <Button
            variant={viewMode === 'stores' ? 'secondary' : 'ghost'}
            className={`h-10 rounded-lg px-4 ${viewMode === 'stores' ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
            onClick={() => onViewModeChange('stores')}
          >
            Stores
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:justify-end">
          {viewMode === 'gears' ? (
            <>
              <select className="h-10 w-full rounded-xl border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] xl:w-auto xl:min-w-40" value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                className="h-10 w-full rounded-xl border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] xl:w-44"
                list="homepage-brand-options"
                placeholder="Brand"
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
            <select className="h-10 w-full rounded-xl border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] sm:col-span-2 xl:w-auto xl:min-w-44" value={sortMode} onChange={(event) => onSortModeChange(event.target.value as SortMode)}>
              <option value="default">Show all stores</option>
              <option value="store_az">Store name A-Z</option>
              <option value="store_za">Store name Z-A</option>
            </select>
          )}
          <select className="h-10 w-full rounded-xl border border-[var(--tone-border)] bg-white px-3 py-2 text-sm text-[var(--tone-text)] xl:w-auto" value={minRating} onChange={(event) => onMinRatingChange(event.target.value)}>
            <option value="0">Any rating</option>
            <option value="4.5">4.5+ stars</option>
            <option value="4">4.0+ stars</option>
            <option value="3.5">3.5+ stars</option>
            <option value="3">3.0+ stars</option>
          </select>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 xl:flex">
            <Button
              variant={nearMeOnly ? 'secondary' : 'outline'}
              className={`h-10 rounded-xl ${nearMeOnly ? 'bg-[var(--tone-text)] text-[var(--color-primary-foreground)] hover:bg-[var(--tone-text)]' : 'border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]'}`}
              onClick={onToggleNearMe}
            >
              <MapPin className="mr-2 h-4 w-4" /> {locating ? 'Locating...' : nearMeOnly ? 'Near me' : 'Near me'}
            </Button>
            <Button variant="outline" className="h-10 rounded-xl border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]" onClick={onClearSearch}>
              <X className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--tone-text-muted)]">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>{activeFilterCount ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active` : 'Ready to browse'}</span>
      </div>
    </div>
  );
}
