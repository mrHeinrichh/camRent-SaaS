import { useEffect, useState } from 'react';
import { MapPin, Search, Star } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { useAppStore } from '@/src/store';
import type { Item, Store, StoreReview } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

interface StorePageProps {
  storeId: string;
  onNavigateItem: (id: string) => void;
}

export function StorePage({ storeId, onNavigateItem }: StorePageProps) {
  const [store, setStore] = useState<(Store & { items: Item[] }) | null>(null);
  const [storeReviews, setStoreReviews] = useState<StoreReview[]>([]);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [rateReason, setRateReason] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, description: '' });
  const [selectedCategory, setSelectedCategory] = useState<string>('All Gear');
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.role === 'owner') return;

    Promise.all([api.get<Store & { items: Item[] }>(`/api/stores/${storeId}`), api.get<{ average_rating: number; total_reviews: number; reviews: StoreReview[] }>(`/api/stores/${storeId}/reviews`)])
      .then(async ([storeData, reviewData]) => {
        setStore(storeData);
        setStoreReviews(reviewData.reviews || []);
        setReviewAverage(Number(reviewData.average_rating || 0));
        setReviewTotal(Number(reviewData.total_reviews || 0));
        if (user?.role === 'renter') {
          try {
            const eligibility = await api.get<{ canRate: boolean; reason?: string }>(`/api/stores/${storeId}/review-eligibility`);
            setCanRate(Boolean(eligibility.canRate));
            setRateReason(String(eligibility.reason || ''));
          } catch {
            setCanRate(false);
          }
        } else {
          setCanRate(false);
        }
      })
      .finally(() => setLoading(false));
  }, [storeId, user]);

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading store...</div>;
  if (!store) return <div>Store not found</div>;
  const availableCategories = ['All Gear', ...Array.from(new Set(store.items.map((item) => item.category).filter(Boolean)))];
  const visibleItems = selectedCategory === 'All Gear' ? store.items : store.items.filter((item) => item.category === selectedCategory);

  return (
    <div className="pb-20">
      <div className="relative h-64 overflow-hidden md:h-80">
        <img
          src={store.banner_url || `https://picsum.photos/seed/banner-${store.id}/1920/600`}
          className="h-full w-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
          <div className="container mx-auto flex items-end gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl md:h-32 md:w-32">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/200/200`} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="mb-2">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">{store.name}</h1>
              <div className="mb-2 flex items-center gap-2 text-sm text-white/90">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> {reviewAverage.toFixed(1)} ({reviewTotal} review{reviewTotal === 1 ? '' : 's'})
              </div>
              <p className="max-w-xl line-clamp-2 text-white/80">{store.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-12 px-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full space-y-6 md:w-64">
            <div>
              <h4 className="mb-3 font-semibold">Categories</h4>
              <div className="space-y-1">
                {availableCategories.map((category) => (
                  <Button key={category} variant={selectedCategory === category ? 'secondary' : 'ghost'} className="w-full justify-start font-normal" onClick={() => setSelectedCategory(category)}>
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            {store.branches?.length ? (
              <div>
                <h4 className="mb-3 font-semibold">Branches</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {store.branches.map((branch) => (
                    <div key={branch._id || branch.address} className="rounded border bg-muted/20 p-2">
                      <p className="font-medium text-foreground">{branch.name || 'Branch'}</p>
                      <p>{branch.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {(store.payment_details || (store.payment_detail_images || []).length) ? (
              <div>
                <h4 className="mb-2 font-semibold">Payment Details</h4>
                {store.payment_details ? <p className="mb-2 whitespace-pre-line text-sm text-muted-foreground">{store.payment_details}</p> : null}
                {(store.payment_detail_images || []).length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(store.payment_detail_images || []).map((url, index) => (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border bg-muted/20">
                        <img src={url} alt={`Payment reference ${index + 1}`} className="h-20 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div>
              <h4 className="mb-2 font-semibold">Store Ratings</h4>
              <p className="mb-2 text-sm text-muted-foreground">Average: {reviewAverage.toFixed(1)} / 5 ({reviewTotal} total)</p>
              {user?.role === 'renter' ? (
                canRate ? (
                  <Card className="space-y-2 p-3">
                    <select
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={reviewForm.rating}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Math.max(1, Math.min(5, Number(event.target.value) || 5)) }))}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} star{rating === 1 ? '' : 's'}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Write your review..."
                      value={reviewForm.description}
                      onChange={(event) => setReviewForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                    <Button
                      onClick={async () => {
                        if (!reviewForm.description.trim()) return alert('Please add review description.');
                        await api.post(`/api/stores/${storeId}/reviews`, { rating: reviewForm.rating, description: reviewForm.description.trim() });
                        const refreshed = await api.get<{ average_rating: number; total_reviews: number; reviews: StoreReview[] }>(`/api/stores/${storeId}/reviews`);
                        setStoreReviews(refreshed.reviews || []);
                        setReviewAverage(Number(refreshed.average_rating || 0));
                        setReviewTotal(Number(refreshed.total_reviews || 0));
                        setCanRate(false);
                        setRateReason('You already rated this store.');
                        setReviewForm({ rating: 5, description: '' });
                      }}
                    >
                      Submit Rating
                    </Button>
                  </Card>
                ) : (
                  <p className="text-xs text-muted-foreground">{rateReason || 'You can rate this store after your first successful transaction.'}</p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Login as renter to submit a rating.</p>
              )}
              <div className="mt-2 space-y-2">
                {storeReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded border bg-muted/20 p-2">
                    <p className="text-sm font-medium">{review.renter_name}</p>
                    <p className="text-xs">Rating: {review.rating}/5</p>
                    <p className="text-xs text-muted-foreground">{review.description}</p>
                  </div>
                ))}
                {!storeReviews.length && <p className="text-xs text-muted-foreground">No reviews yet.</p>}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Equipment</h2>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {store.address}
                </div>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search gear..." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <Card key={item.id} className="group cursor-pointer overflow-hidden" onClick={() => onNavigateItem(item.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image_url || `https://picsum.photos/seed/item-${item.id}/400/400`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 font-bold">{item.name}</h3>
                    <p className="mb-4 line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mb-2 text-xs text-muted-foreground">Brand: {item.brand || 'Others'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">{formatPHP(item.daily_price)}</span>
                        <span className="text-xs text-muted-foreground"> / day</span>
                        <p className="text-xs text-muted-foreground">Stock: {Math.max(0, item.stock || 0)}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
