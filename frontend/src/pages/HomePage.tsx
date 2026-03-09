import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, ShoppingCart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { useAppStore } from '@/src/store';
import type { Announcement, Store } from '@/src/types/domain';
import { Button, Card } from '@/src/components/ui';

interface HomePageProps {
  onNavigate: (id: string) => void;
}

interface GearFeedItem {
  id: string;
  store_id: string;
  name: string;
  description: string;
  daily_price: number;
  image_url: string;
  category: string;
  brand?: string;
  stock?: number;
  store: {
    id: string;
    name: string;
    logo_url: string;
    rating: number;
    location_lat?: number | null;
    location_lng?: number | null;
    branches?: Array<{
      name?: string;
      address?: string;
      location_lat?: number | null;
      location_lng?: number | null;
    }>;
  };
}

type SortMode = 'default' | 'store_az' | 'store_za';
type ViewMode = 'gears' | 'stores';

const BRAND_OPTIONS = [
  'All Brands',
  'Canon',
  'Nikon',
  'Sony',
  'Fujifilm',
  'Panasonic',
  'Olympus',
  'OM System',
  'Leica',
  'Pentax',
  'Hasselblad',
  'Phase One',
  'Ricoh',
  'Kodak',
  'Polaroid',
  'GoPro',
  'DJI',
  'Blackmagic',
  'RED',
  'ARRI',
  'Z CAM',
  'Insta360',
  'YI',
  'Sigma',
  'Tamron',
  'Tokina',
  'Samyang',
  'Rokinon',
  'Viltrox',
  'Laowa',
  'Zeiss',
  'Voigtlander',
  'Meike',
  'TTArtisan',
  '7Artisans',
  'Mitakon',
  'Others',
] as const;

export function HomePage({ onNavigate }: HomePageProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [gears, setGears] = useState<GearFeedItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('gears');
  const [selectedCategory, setSelectedCategory] = useState('All Gear');
  const [selectedBrand, setSelectedBrand] = useState('');
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

  const distanceInKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const availableCategories = useMemo(() => {
    const unique = Array.from(new Set(gears.map((gear) => String(gear.category || '').trim()).filter(Boolean)));
    return ['All Gear', ...unique];
  }, [gears]);

  const normalizedBrand = (value: string) => (value || 'Others').toLowerCase().replace(/\s+/g, '');
  const knownBrandSet = useMemo(() => new Set(BRAND_OPTIONS.filter((brand) => brand !== 'All Brands' && brand !== 'Others').map((brand) => normalizedBrand(String(brand)))), []);

  const filteredGears = useMemo(() => {
    const ratingFloor = Number(minRating) || 0;
    const query = homeSearchQuery.trim().toLowerCase();
    return gears.filter((gear) => {
      const brand = gear.brand || 'Others';
      const matchesSearch =
        !query ||
        `${gear.name} ${gear.description || ''} ${gear.category || ''} ${brand} ${gear.store.name || ''}`.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'All Gear' || String(gear.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchesBrand =
        selectedBrand === 'All Brands'
          ? true
          : selectedBrand === 'Others'
            ? !knownBrandSet.has(normalizedBrand(brand)) || normalizedBrand(brand) === 'others'
            : normalizedBrand(brand).includes(normalizedBrand(selectedBrand));
      const matchesRating = Number(gear.store.rating || 0) >= ratingFloor;

      let matchesNearMe = true;
      if (nearMeOnly) {
        if (!userLocation) {
          matchesNearMe = false;
        } else {
          const candidates = [
            { lat: gear.store.location_lat, lng: gear.store.location_lng },
            ...((gear.store.branches || []).map((branch) => ({ lat: branch.location_lat, lng: branch.location_lng })) || []),
          ];
          matchesNearMe = candidates.some((candidate) => {
            if (candidate.lat == null || candidate.lng == null) return false;
            return distanceInKm(userLocation.lat, userLocation.lng, Number(candidate.lat), Number(candidate.lng)) <= 25;
          });
        }
      }
      return matchesSearch && matchesCategory && matchesBrand && matchesRating && matchesNearMe;
    });
  }, [gears, homeSearchQuery, minRating, nearMeOnly, selectedCategory, selectedBrand, userLocation, knownBrandSet]);

  const filteredStores = useMemo(() => {
    const ratingFloor = Number(minRating) || 0;
    const query = homeSearchQuery.trim().toLowerCase();
    const filtered = stores.filter((store) => {
      const matchesSearch = !query || `${store.name} ${store.address} ${store.description || ''}`.toLowerCase().includes(query);
      const matchesRating = Number(store.rating || 0) >= ratingFloor;
      let matchesNearMe = true;
      if (nearMeOnly) {
        if (!userLocation) {
          matchesNearMe = false;
        } else {
          const candidates = [
            { lat: store.location_lat, lng: store.location_lng },
            ...((store.branches || []).map((branch) => ({ lat: branch.location_lat, lng: branch.location_lng })) || []),
          ];
          matchesNearMe = candidates.some((candidate) => {
            if (candidate.lat == null || candidate.lng == null) return false;
            return distanceInKm(userLocation.lat, userLocation.lng, Number(candidate.lat), Number(candidate.lng)) <= 25;
          });
        }
      }
      return matchesSearch && matchesRating && matchesNearMe;
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

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {announcements.length ? (
        <div className="mb-8">
          {(() => {
            const item = announcements[activeAnnouncement];
            const content = (
              <div className="h-60 w-full overflow-hidden rounded-xl bg-muted">
                {item?.image_url ? (
                  <img src={item.image_url} alt="Announcement" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground">
                    {item?.title || item?.description || 'Announcement'}
                  </div>
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
                <button key={entry.id} type="button" className={`h-1.5 w-8 rounded-full ${index === activeAnnouncement ? 'bg-primary' : 'bg-muted'}`} onClick={() => setActiveAnnouncement(index)} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Rent Professional Gear <br /> from Local Stores
        </h1>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Button variant={viewMode === 'gears' ? 'secondary' : 'outline'} onClick={() => setViewMode('gears')}>
          Gears
        </Button>
        <Button variant={viewMode === 'stores' ? 'secondary' : 'outline'} onClick={() => setViewMode('stores')}>
          Stores
        </Button>
        <Button variant="outline" onClick={() => setHomeSearchQuery('')}>
          Clear Search
        </Button>
        {viewMode === 'gears' ? (
          <>
            <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              list="homepage-brand-options"
              placeholder="Brand ex. Sony, Canon..."
              value={selectedBrand}
              onChange={(event) => setSelectedBrand(event.target.value)}
            />
            <datalist id="homepage-brand-options">
              {BRAND_OPTIONS.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </>
        ) : (
          <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="default">Show all stores</option>
            <option value="store_az">Store name A-Z</option>
            <option value="store_za">Store name Z-A</option>
          </select>
        )}
        <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={minRating} onChange={(event) => setMinRating(event.target.value)}>
          <option value="0">Filter by ratings</option>
          <option value="4.5">4.5+</option>
          <option value="4">4.0+</option>
          <option value="3.5">3.5+</option>
          <option value="3">3.0+</option>
        </select>
        <Button
          variant={nearMeOnly ? 'secondary' : 'outline'}
          onClick={() => {
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
          }}
        >
          <MapPin className="mr-2 h-4 w-4" /> {locating ? 'Getting location...' : nearMeOnly ? 'Near me: ON' : 'Near me'}
        </Button>
      </div>

      {viewMode === 'gears' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pagedGears.map((gear) => (
            <motion.div key={gear.id} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
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
                    <button className="text-left text-sm font-semibold hover:underline" onClick={() => onNavigate(gear.store.id)}>
                      {gear.store.name}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{formatPHP(Number(gear.daily_price || 0))}</p>
                      <p className="text-xs text-muted-foreground">per day</p>
                    </div>
                    <Button
                      className="gap-2"
                      onClick={() => {
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
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to cart
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pagedStores.map((store) => (
            <motion.div key={store.id} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="group cursor-pointer overflow-hidden" onClick={() => onNavigate(store.id)}>
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
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {activeTotal ? (currentPage - 1) * 30 + 1 : 0}-{Math.min(currentPage * 30, activeTotal)} of {activeTotal}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
            Next
          </Button>
        </div>
      </div>

      <footer className="mt-16 border-t bg-muted/20">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3">
            <p className="text-base font-extrabold  ">CamRent PH</p>
            <p className="text-sm text-muted-foreground">
              Camera rental workflow platform built for inventory management, renter history, and fraud monitoring for rental businesses.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">About Us</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('about')}>
                Who We Are
              </button>
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('about')}>
                Founder
              </button>
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('about')}>
                Mission
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">Policies</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('policies')}>
                Terms & Conditions
              </button>
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('policies')}>
                Privacy Policy
              </button>
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('policies')}>
                Data & Security Notice
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">Useful Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('policies')}>
                Helps & FAQ
              </button>
              <button
                type="button"
                className="block hover:text-foreground"
                onClick={() => {
                  alert('You must login to add feedback.');
                  setPage('login');
                }}
              >
                Feedback
              </button>
              <button type="button" className="block hover:text-foreground" onClick={() => setPage('policies')}>
                Rental Guide
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">Follow Us</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground">
                Facebook
              </a>
              <a href="#" className="block hover:text-foreground">
                Instagram
              </a>
              <a href="#" className="block hover:text-foreground">
                TikTok
              </a>
            </div>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} CamRent PH. All rights reserved.</div>
      </footer>
    </div>
  );
}
