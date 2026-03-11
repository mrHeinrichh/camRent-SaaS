import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Facebook, Globe, Instagram, MapPin, Music2, Receipt, Search, ShieldAlert, Star } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { useAppStore } from '@/src/store';
import type { Item, Store, StoreReview } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';
import { AppFooter } from '@/src/components/layout/AppFooter';
import { EmptyState } from '@/src/components/EmptyState';

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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [reportForm, setReportForm] = useState({ subject: '', message: '' });
  const [storeQrUrl, setStoreQrUrl] = useState('');
  const [storeQrError, setStoreQrError] = useState('');
  const { user, setPage } = useAppStore();

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const baseUrl = window.location.origin;
    const storeLink = `${baseUrl}/?store=${storeId}`;
    QRCode.toDataURL(storeLink, { width: 320, margin: 1 })
      .then((url) => {
        setStoreQrUrl(url);
        setStoreQrError('');
      })
      .catch((error) => {
        console.error('[store] qr failed', error);
        setStoreQrUrl('');
        setStoreQrError('Unable to generate QR code.');
      });
  }, [storeId]);

  if (user?.role === 'owner') return null;
  if (loading) return <div className="flex h-96 items-center justify-center">Loading store...</div>;
  if (!store)
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState title="Store Not Available" message="This store is not available as of the moment. Please try again later." />
      </div>
    );
  const rawStore = store as Record<string, any>;
  const socialLinks = {
    facebook: String(rawStore.facebook_url || '').trim(),
    instagram: String(rawStore.instagram_url || '').trim(),
    tiktok: String(rawStore.tiktok_url ?? rawStore.tiktokUrl ?? '').trim(),
    custom: (Array.isArray(rawStore.custom_social_links)
      ? rawStore.custom_social_links
      : Array.isArray(rawStore.customSocialLinks)
        ? rawStore.customSocialLinks
        : []
    )
      .map((entry: unknown) => String(entry || '').trim())
      .filter(Boolean),
  };
  const availableCategories = ['All Gear', ...Array.from(new Set(store.items.map((item) => item.category).filter(Boolean)))];
  const visibleItems = selectedCategory === 'All Gear' ? store.items : store.items.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--tone-bg)] pb-12">
      <div className="relative h-60 overflow-hidden sm:h-64 md:h-80">
        <img
          src={store.banner_url || `https://picsum.photos/seed/banner-${store.id}/1920/600`}
          className="h-full w-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 w-full p-4 text-white sm:p-6">
          <div className="container mx-auto flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl sm:h-24 sm:w-24 md:h-32 md:w-32">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/200/200`} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </div>
            <div className="mb-1">
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">{store.name}</h1>
              <div className="mb-2 flex items-center gap-2 text-sm text-white/90">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> {reviewAverage.toFixed(1)} ({reviewTotal} review{reviewTotal === 1 ? '' : 's'})
              </div>
              <p className="max-w-xl line-clamp-2 text-white/80">{store.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-10 px-4">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full space-y-6 md:w-72">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="mb-3 font-semibold">Branches</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {store.branches.map((branch) => (
                    <div key={branch._id || branch.address} className="rounded border bg-muted/20 p-2">
                      <p className="font-medium text-foreground">{branch.name || 'Branch'}</p>
                      <p className="inline-flex items-start gap-1">
                        <MapPin className="mt-0.5 h-3 w-3 text-slate-500" />
                        <span>{branch.address}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {(store.payment_details || (store.payment_detail_images || []).length) ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 inline-flex items-center gap-2 font-semibold">
                  <Receipt className="h-4 w-4 text-slate-500" /> Payment Details
                </h4>
                {store.payment_details ? <p className="mb-2 whitespace-pre-line text-sm text-muted-foreground">{store.payment_details}</p> : null}
                {(store.payment_detail_images || []).length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(store.payment_detail_images || []).map((url, index) => (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border bg-muted/20 p-2">
                        <div className="flex h-36 items-center justify-center overflow-hidden rounded bg-background">
                          <img src={url} alt={`Payment reference ${index + 1}`} className="h-full w-full object-contain" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.custom.length) ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="mb-2 font-semibold">Social Links</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {socialLinks.facebook ? (
                    <a className="inline-flex items-center gap-2 underline" href={socialLinks.facebook} target="_blank" rel="noreferrer">
                      <Facebook className="h-4 w-4 text-blue-600" /> {socialLinks.facebook}
                    </a>
                  ) : null}
                  {socialLinks.instagram ? (
                    <a className="inline-flex items-center gap-2 underline" href={socialLinks.instagram} target="_blank" rel="noreferrer">
                      <Instagram className="h-4 w-4 text-pink-600" /> {socialLinks.instagram}
                    </a>
                  ) : null}
                  {socialLinks.tiktok ? (
                    <a className="inline-flex items-center gap-2 underline" href={socialLinks.tiktok} target="_blank" rel="noreferrer">
                      <Music2 className="h-4 w-4 text-slate-900" /> {socialLinks.tiktok}
                    </a>
                  ) : null}
                  {socialLinks.custom.map((link, index) => (
                    <a key={`${link}-${index}`} className="inline-flex items-center gap-2 underline" href={link} target="_blank" rel="noreferrer">
                      <Globe className="h-4 w-4 text-slate-600" /> {link}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <h4 className="mb-2 font-semibold">Store QR Code</h4>
              {storeQrUrl ? (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <img src={storeQrUrl} alt="Store QR code" className="mx-auto h-40 w-40 rounded border bg-white p-2" />
                  <p className="mt-2 text-xs text-muted-foreground">Scan to open this store page.</p>
                  <a href={storeQrUrl} download={`store-${storeId}-qr.png`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 underline">
                    <Download className="h-4 w-4" /> Download QR
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{storeQrError || 'QR code unavailable.'}</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 inline-flex items-center gap-2 font-semibold">
                <Star className="h-4 w-4 text-yellow-500" /> Store Ratings
              </h4>
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
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 inline-flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Report This Store
              </h4>
              <p className="text-xs text-muted-foreground">
                Reports are reviewed by the super admin. Please include clear details.
              </p>
              <Button
                className="mt-3 w-full"
                variant="destructive"
                onClick={() => {
                  if (!user) {
                    alert('Please login to report this store.');
                    setPage('login');
                    return;
                  }
                  if (user.role !== 'renter') {
                    alert('Only customers can report a store.');
                    return;
                  }
                  setReportOpen(true);
                }}
              >
                Report Store
              </Button>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Available Equipment</h2>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {store.address}
                  </div>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-11 rounded-full pl-9" placeholder="Search gear..." />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => (
                <Card key={item.id} className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" onClick={() => onNavigateItem(item.id)}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image_url || `https://picsum.photos/seed/item-${item.id}/400/400`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 text-sm font-extrabold text-slate-900 sm:text-base">{item.name}</h3>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-500 sm:text-sm">{item.description || 'No description provided.'}</p>
                    <p className="mb-2 text-[11px] text-slate-500">Brand: {item.brand || 'Others'}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-slate-900 sm:text-base">{formatPHP(item.daily_price)}</span>
                        <span className="text-xs text-slate-500"> / day</span>
                        <p className="text-[11px] text-slate-500">Stock: {Math.max(0, item.stock || 0)}</p>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {!visibleItems.length ? (
              <div className="mt-4">
                <EmptyState title="No Gears Available" message="No available gear right now. Try again later." />
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg space-y-4 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Report {store.name}</h3>
                <p className="text-xs text-muted-foreground">Only logged-in customers can submit a report.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setReportOpen(false)} aria-label="Close report dialog">
                X
              </Button>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Reporter Details</p>
              <p>{user?.full_name || 'Customer'}</p>
              <p>{user?.email || '-'}</p>
              <p>{user?.phone || '-'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={reportForm.subject}
                onChange={(event) => setReportForm((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Short summary of the issue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={reportForm.message}
                onChange={(event) => setReportForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Describe the problem in detail."
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={reportSending}
                onClick={async () => {
                  if (!reportForm.subject.trim() || !reportForm.message.trim()) {
                    alert('Subject and message are required.');
                    return;
                  }
                  try {
                    setReportSending(true);
                    await api.post(`/api/stores/${storeId}/report`, {
                      subject: reportForm.subject.trim(),
                      message: reportForm.message.trim(),
                    });
                    setReportOpen(false);
                    setReportForm({ subject: '', message: '' });
                    alert('Report submitted. The admin will review it.');
                  } finally {
                    setReportSending(false);
                  }
                }}
              >
                {reportSending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      <AppFooter onNavigate={setPage} />
    </div>
  );
}
