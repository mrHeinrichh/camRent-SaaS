import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { Announcement, Store } from '@/src/types/domain';
import { Button } from '@/src/components/ui';
import { AppFooter } from '@/src/components/layout/AppFooter';
import { siteTheme } from '@/src/config/siteTheme';
import { HomeFilterBar } from '@/src/features/home/components/HomeFilterBar';
import { GearCard } from '@/src/features/home/components/GearCard';
import { StoreCard } from '@/src/features/home/components/StoreCard';
import { BRAND_OPTIONS } from '@/src/features/home/constants';
import type { GearFeedItem, SortMode, ViewMode } from '@/src/features/home/types';

interface HomePageProps {
  onNavigate: (id: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [gears, setGears] = useState<GearFeedItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('gears');
  const [selectedCategory, setSelectedCategory] = useState('All Gear');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [minRating, setMinRating] = useState('0');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user, homeSearchQuery, setHomeSearchQuery, addToCart, setPage } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner') return;
    Promise.all([api.get<Store[]>('/api/stores'), api.get<GearFeedItem[]>('/api/items/feed').catch(() => []), api.get<Announcement[]>('/api/announcements')])
      .then(([storesData, gearsData, announcementsData]) => {
        setStores(storesData || []);
        setGears(Array.isArray(gearsData) ? gearsData : []);
        setAnnouncements(announcementsData || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => setActiveAnnouncement((prev) => (prev + 1) % announcements.length), 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  useEffect(() => {
    if (activeAnnouncement >= announcements.length) setActiveAnnouncement(0);
  }, [activeAnnouncement, announcements.length]);

  const availableCategories = useMemo(() => {
    const unique = Array.from(new Set(gears.map((gear) => String(gear.category || '').trim()).filter(Boolean)));
    return ['All Gear', ...unique];
  }, [gears]);

  const normalizedBrand = (value: string) => (value || 'Others').toLowerCase().replace(/\s+/g, '');
  const knownBrandSet = useMemo(() => new Set(BRAND_OPTIONS.filter((brand) => brand !== 'All Brands' && brand !== 'Others').map((brand) => normalizedBrand(String(brand)))), []);

  const distanceInKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const matchesNearMe = (candidates: Array<{ lat?: number | null; lng?: number | null }>) => {
    if (!nearMeOnly) return true;
    if (!userLocation) return false;
    return candidates.some((candidate) => {
      if (candidate.lat == null || candidate.lng == null) return false;
      return distanceInKm(userLocation.lat, userLocation.lng, Number(candidate.lat), Number(candidate.lng)) <= 25;
    });
  };

  const filteredGears = useMemo(() => {
    const ratingFloor = Number(minRating) || 0;
    const query = homeSearchQuery.trim().toLowerCase();
    return gears.filter((gear) => {
      const brand = gear.brand || 'Others';
      const matchesSearch = !query || `${gear.name} ${gear.description || ''} ${gear.category || ''} ${brand} ${gear.store.name || ''}`.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All Gear' || String(gear.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchesBrand =
        selectedBrand === 'All Brands'
          ? true
          : selectedBrand === 'Others'
            ? !knownBrandSet.has(normalizedBrand(brand)) || normalizedBrand(brand) === 'others'
            : normalizedBrand(brand).includes(normalizedBrand(selectedBrand));
      const matchesRating = Number(gear.store.rating || 0) >= ratingFloor;
      const near = matchesNearMe([{ lat: gear.store.location_lat, lng: gear.store.location_lng }, ...((gear.store.branches || []).map((branch) => ({ lat: branch.location_lat, lng: branch.location_lng })) || [])]);
      return matchesSearch && matchesCategory && matchesBrand && matchesRating && near;
    });
  }, [gears, homeSearchQuery, minRating, nearMeOnly, selectedCategory, selectedBrand, userLocation, knownBrandSet]);

  const filteredStores = useMemo(() => {
    const ratingFloor = Number(minRating) || 0;
    const query = homeSearchQuery.trim().toLowerCase();
    const filtered = stores.filter((store) => {
      const matchesSearch = !query || `${store.name} ${store.address} ${store.description || ''}`.toLowerCase().includes(query);
      const matchesRating = Number(store.rating || 0) >= ratingFloor;
      const near = matchesNearMe([{ lat: store.location_lat, lng: store.location_lng }, ...((store.branches || []).map((branch) => ({ lat: branch.location_lat, lng: branch.location_lng })) || [])]);
      return matchesSearch && matchesRating && near;
    });
    if (sortMode === 'store_az') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'store_za') return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    return filtered;
  }, [stores, homeSearchQuery, minRating, nearMeOnly, sortMode, userLocation]);

  const activeTotal = viewMode === 'gears' ? filteredGears.length : filteredStores.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / 30));
  const pagedGears = useMemo(() => filteredGears.slice((currentPage - 1) * 30, currentPage * 30), [filteredGears, currentPage]);
  const pagedStores = useMemo(() => filteredStores.slice((currentPage - 1) * 30, currentPage * 30), [filteredStores, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, homeSearchQuery, minRating, nearMeOnly, selectedCategory, selectedBrand, sortMode, userLocation]);

  const handleAddToCart = (gear: GearFeedItem) => {
    if (user?.role === 'owner' || user?.role === 'admin') return;
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + 2);
    const toISODate = (value: Date) => value.toISOString().slice(0, 10);
    addToCart({
      id: gear.id,
      name: gear.name,
      daily_price: Number(gear.daily_price || 0),
      deposit_amount: 0,
      image_url: gear.image_url || '',
      quantity: 1,
      stock: Math.max(1, Number(gear.stock || 1)),
      startDate: toISODate(start),
      endDate: toISODate(end),
      store_id: gear.store_id,
    });
    setPage('cart');
  };

  const handleToggleNearMe = () => {
    if (!nearMeOnly && !userLocation) {
      if (!navigator.geolocation) return alert('Geolocation is not available.');
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setNearMeOnly(true);
          setLocating(false);
        },
        () => {
          setLocating(false);
          alert('Unable to get your location.');
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
      return;
    }
    setNearMeOnly((prev) => !prev);
  };

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center bg-[var(--tone-bg)] text-[var(--tone-text)]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[var(--tone-bg)]">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-8 rounded-sm border border-[var(--tone-border)] bg-[var(--tone-surface)] p-4 shadow-sm md:p-7">
          <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-5 animate-fade-up">
              <p className="inline-block border-2 border-[var(--tone-text-muted)] px-3 py-1 text-4xl font-bold tracking-tight text-[var(--tone-text-muted)]">{siteTheme.home.badge}</p>
              <h1 className="max-w-xs text-3xl font-semibold leading-tight text-[var(--tone-text)] md:text-4xl">{siteTheme.home.title}</h1>
              <p className="max-w-sm text-sm leading-relaxed text-[var(--tone-text-muted)]">{siteTheme.home.subtitle}</p>
              <div className="flex gap-3 text-xs text-[var(--tone-text-muted)]">
                <span>{stores.length} Stores</span>
                <span>•</span>
                <span>{gears.length} Gears</span>
              </div>
            </div>

            <div className="relative h-[330px] animate-fade-up-delay md:h-[420px]">
              <div className="absolute right-[12%] top-2 h-[78%] w-[72%] overflow-hidden rounded-sm border border-[var(--tone-border)] bg-white shadow-lg">
                <img
                  src={siteTheme.home.heroImages[0]}
                  alt="Camera setup"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute left-[2%] top-[28%] h-[62%] w-[68%] overflow-hidden rounded-sm border border-[var(--tone-border)] bg-white shadow-lg">
                <img
                  src={siteTheme.home.heroImages[1]}
                  alt="Studio gear"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-[45%] w-[34%] overflow-hidden rounded-sm border border-[var(--tone-border)] bg-white shadow-lg">
                <img
                  src={siteTheme.home.heroImages[2]}
                  alt="Lens close-up"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>

        {announcements.length ? (
          <section className="mb-7 animate-fade-up">
            {(() => {
              const item = announcements[activeAnnouncement];
              const content = (
                <div className="h-48 w-full overflow-hidden rounded-2xl border border-[var(--tone-nav-border)] bg-[var(--tone-surface-soft)]">
                  {item?.image_url ? (
                    <img src={item.image_url} alt="Announcement" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-medium text-[var(--tone-text-muted)]">{item?.title || item?.description || 'Announcement'}</div>
                  )}
                </div>
              );
              return item?.cta_url ? (
                <a href={item.cta_url} target="_blank" rel="noreferrer" className="block">
                  {content}
                </a>
              ) : (
                content
              );
            })()}
            {announcements.length > 1 ? (
              <div className="mt-2 flex justify-center gap-1.5">
                {announcements.map((entry, index) => (
                  <button key={entry.id} type="button" className={`h-1.5 w-8 rounded-full ${index === activeAnnouncement ? 'bg-[var(--tone-text)]' : 'bg-[var(--tone-nav-border)]'}`} onClick={() => setActiveAnnouncement(index)} />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <HomeFilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClearSearch={() => setHomeSearchQuery('')}
          selectedCategory={selectedCategory}
          availableCategories={availableCategories}
          onCategoryChange={setSelectedCategory}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          nearMeOnly={nearMeOnly}
          locating={locating}
          onToggleNearMe={handleToggleNearMe}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--tone-text)]">{viewMode === 'gears' ? 'Available Gears' : 'Available Stores'}</h2>
          <p className="text-xs text-[var(--tone-text-muted)]">{activeTotal} result(s)</p>
        </div>

        {viewMode === 'gears' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {pagedGears.map((gear) => (
              <GearCard key={gear.id} gear={gear} onOpenStore={onNavigate} onAddToCart={handleAddToCart} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
            {pagedStores.map((store) => (
              <StoreCard key={store.id} store={store} onOpenStore={onNavigate} />
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface)] p-3">
          <p className="text-sm text-[var(--tone-text-muted)]">
            Showing {activeTotal ? (currentPage - 1) * 30 + 1 : 0}-{Math.min(currentPage * 30, activeTotal)} of {activeTotal}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-[var(--tone-text-muted)]">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              className="border-[var(--tone-border)] bg-white text-[var(--tone-text)] hover:bg-[var(--tone-surface)]"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        <AppFooter onNavigate={setPage} />
      </div>
    </div>
  );
}
