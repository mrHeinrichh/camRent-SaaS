import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Search, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { Announcement, Store } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

interface HomePageProps {
  onNavigate: (id: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner') return;

    Promise.all([api.get<Store[]>('/api/stores'), api.get<Announcement[]>('/api/announcements')])
      .then(([storesData, announcementsData]) => {
        setStores(storesData);
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

  const filteredStores = useMemo(() => {
    const ratingFloor = Number(minRating) || 0;
    return stores.filter((store) => {
      const matchesSearch =
        !searchQuery.trim() ||
        `${store.name} ${store.address} ${store.description || ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesRating = Number(store.rating || 0) >= ratingFloor;
      let matchesNearMe = true;
      if (nearMeOnly) {
        if (!userLocation || store.location_lat == null || store.location_lng == null) {
          matchesNearMe = false;
        } else {
          matchesNearMe = distanceInKm(userLocation.lat, userLocation.lng, Number(store.location_lat), Number(store.location_lng)) <= 25;
        }
      }
      return matchesSearch && matchesRating && matchesNearMe;
    });
  }, [stores, searchQuery, minRating, nearMeOnly, userLocation]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / 30));
  const pagedStores = useMemo(() => filteredStores.slice((currentPage - 1) * 30, currentPage * 30), [filteredStores, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, minRating, nearMeOnly, userLocation]);

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading stores...</div>;

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
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          The easiest way to find and rent cameras, lenses, and production equipment.
        </p>
      </div>

      <div className="mb-8 mx-auto max-w-md relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search stores..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
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
        {nearMeOnly ? <p className="text-xs text-muted-foreground">Showing stores within ~25km.</p> : null}
      </div>

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
                  {store.rating || '4.8'}
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

                <Button className="w-full group-hover:bg-primary/90">
                  Visit Store
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStores.length ? (currentPage - 1) * 30 + 1 : 0}-{Math.min(currentPage * 30, filteredStores.length)} of {filteredStores.length}
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

      <footer className="mt-16 border-t pt-6 text-center text-sm text-muted-foreground">
        <p>CamRent Marketplace</p>
        <p className="mt-1">Find gear faster. Rent safer.</p>
      </footer>
    </div>
  );
}
