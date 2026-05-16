import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { ChevronDown, Download, Facebook, Globe, Instagram, ListFilter, MapPin, Music2, QrCode, Receipt, Search, ShieldAlert, Star, Store as StoreIcon } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { getRentalBillingModeLabel } from '@/src/lib/rentalPricing';
import { useAppStore } from '@/src/store';
import type { Item, Store, StoreReview } from '@/src/types/domain';
import { Button, Card, Input, cn } from '@/src/components/ui';
import { AppFooter } from '@/src/components/layout/AppFooter';
import { EmptyState } from '@/src/components/EmptyState';

interface StorePageProps {
  storeId: string;
  onNavigateItem: (id: string) => void;
}

interface CompactInfoPanelProps {
  title: string;
  icon: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

type MobileStorePanel = 'branches' | 'payment' | 'social' | 'qr' | null;

interface CompactFactChipProps {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function CompactInfoPanel({ title, icon, badge, defaultOpen = false, children }: CompactInfoPanelProps) {
  return (
    <details
      className="group border-t border-slate-100 first:border-t-0"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {badge ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{badge}</span> : null}
          <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t border-slate-100 px-3 pb-3 pt-2">{children}</div>
    </details>
  );
}

function CompactFactChip({ icon, label, value, active, onClick }: CompactFactChipProps) {
  const content = (
    <>
      <span className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        active ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
      )}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase leading-none text-slate-500">{label}</span>
        {value ? <span className="mt-1 block max-w-[5.75rem] truncate text-xs font-black leading-none text-slate-900">{value}</span> : null}
      </span>
    </>
  );

  const className = cn(
    'flex h-12 shrink-0 items-center gap-2 rounded-xl border px-2.5 text-left transition-colors',
    active ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
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
  const [storeGearSearch, setStoreGearSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [reportForm, setReportForm] = useState({ subject: '', message: '' });
  const [storeQrUrl, setStoreQrUrl] = useState('');
  const [storeQrError, setStoreQrError] = useState('');
  const [storePublicLink, setStorePublicLink] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mobileStorePanel, setMobileStorePanel] = useState<MobileStorePanel>(null);
  const [reviewNotice, setReviewNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [reportNotice, setReportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [reportFormError, setReportFormError] = useState<{ subject?: string; message?: string }>({});
  const { user, setPage } = useAppStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 768px)');
    const syncCategoryMenu = () => setCategoryMenuOpen(media.matches);
    syncCategoryMenu();
    media.addEventListener('change', syncCategoryMenu);
    return () => media.removeEventListener('change', syncCategoryMenu);
  }, [storeId]);

  useEffect(() => {
    setMobileStorePanel(null);
  }, [storeId]);

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
    setStorePublicLink(storeLink);
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
  const normalizedStoreGearSearch = storeGearSearch.trim().toLowerCase();
  const visibleItems = (selectedCategory === 'All Gear' ? store.items : store.items.filter((item) => item.category === selectedCategory)).filter((item) => {
    if (!normalizedStoreGearSearch) return true;
    return `${item.name} ${item.description || ''} ${item.category || ''} ${item.brand || 'Others'} ${formatPHP(item.daily_price)}`
      .toLowerCase()
      .includes(normalizedStoreGearSearch);
  });
  const rentalBillingMode = store.rental_billing_mode === 'calendar_day' ? 'calendar_day' : 'twenty_four_hour';
  const rentalBillingModeLabel = getRentalBillingModeLabel(rentalBillingMode);
  const paymentImages = store.payment_detail_images || [];
  const branchCount = store.branches?.length || 0;
  const paymentBadge = paymentImages.length ? `${paymentImages.length} ref${paymentImages.length === 1 ? '' : 's'}` : undefined;
  const hasPaymentDetails = Boolean(store.payment_details || paymentImages.length);
  const hasSocialLinks = Boolean(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.custom.length);
  const socialLinkCount = [socialLinks.facebook, socialLinks.instagram, socialLinks.tiktok, ...socialLinks.custom].filter(Boolean).length;

  const toggleMobilePanel = (panel: Exclude<MobileStorePanel, null>) => {
    setMobileStorePanel((current) => current === panel ? null : panel);
  };

  const handleReportStore = () => {
    setReportNotice(null);
    if (!user) {
      setReportNotice({ type: 'error', message: 'Please login to report this store.' });
      setTimeout(() => setPage('login'), 2000);
      return;
    }
    if (user.role !== 'renter') {
      setReportNotice({ type: 'error', message: 'Only customers can report a store.' });
      return;
    }
    setReportOpen(true);
  };

  const renderBranchesContent = () => (
    <div className="space-y-2 text-xs text-muted-foreground">
      {(store.branches || []).map((branch) => (
        <div key={branch._id || branch.address} className="rounded-xl border bg-muted/20 p-2">
          <p className="font-bold text-foreground">{branch.name || 'Branch'}</p>
          <p className="mt-1 flex items-start gap-1">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
            <span className="line-clamp-2">{branch.address}</span>
          </p>
        </div>
      ))}
    </div>
  );

  const renderPaymentContent = () => (
    <>
      {store.payment_details ? <p className="mb-2 max-h-28 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{store.payment_details}</p> : null}
      {paymentImages.length ? (
        <div className="grid grid-cols-2 gap-2">
          {paymentImages.map((url, index) => (
            <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-muted/20 p-1.5">
              <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-background sm:h-28">
                <img src={url} alt={`Payment reference ${index + 1}`} className="h-full w-full object-contain" />
              </div>
            </a>
          ))}
        </div>
      ) : null}
    </>
  );

  const renderBillingContent = () => (
    <>
      <p className="text-xs font-semibold text-slate-800">This shop uses {rentalBillingModeLabel}.</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {rentalBillingMode === 'calendar_day'
          ? 'Each selected calendar date counts as one billing day.'
          : 'Billing is counted by elapsed rental time from start date/time to end date/time.'}
      </p>
    </>
  );

  const renderSocialContent = () => (
    <div className="flex flex-col gap-2 text-xs text-[var(--tone-text-muted)]">
      {socialLinks.facebook ? (
        <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.facebook} target="_blank" rel="noreferrer">
          <Facebook className="h-4 w-4 shrink-0 text-blue-600" /> <span className="truncate">{socialLinks.facebook}</span>
        </a>
      ) : null}
      {socialLinks.instagram ? (
        <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.instagram} target="_blank" rel="noreferrer">
          <Instagram className="h-4 w-4 shrink-0 text-pink-600" /> <span className="truncate">{socialLinks.instagram}</span>
        </a>
      ) : null}
      {socialLinks.tiktok ? (
        <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.tiktok} target="_blank" rel="noreferrer">
          <Music2 className="h-4 w-4 shrink-0 text-slate-900" /> <span className="truncate">{socialLinks.tiktok}</span>
        </a>
      ) : null}
      {socialLinks.custom.map((link, index) => (
        <a key={`${link}-${index}`} className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={link} target="_blank" rel="noreferrer">
          <Globe className="h-4 w-4 shrink-0 text-slate-600" /> <span className="truncate">{link}</span>
        </a>
      ))}
    </div>
  );

  const renderQrContent = () => (
    storeQrUrl ? (
      <div className="flex items-center gap-3">
        <img src={storeQrUrl} alt="Store QR code" className="h-24 w-24 shrink-0 rounded-xl border bg-white p-1.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Scan to open this store page.</p>
          {storePublicLink ? (
            <div className="mt-2 min-w-0">
              <code className="block truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-700">{storePublicLink}</code>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 rounded-full px-3"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(storePublicLink);
                    alert('Store link copied.');
                  } catch {
                    alert('Unable to copy. Please copy manually.');
                  }
                }}
              >
                Copy
              </Button>
            </div>
          ) : null}
          <a href={storeQrUrl} download={`store-${storeId}-qr.png`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 underline">
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      </div>
    ) : (
      <p className="text-xs text-muted-foreground">{storeQrError || 'QR code unavailable.'}</p>
    )
  );

  const renderRatingsContent = () => (
    <>
      <p className="mb-2 text-xs text-muted-foreground">Average: {reviewAverage.toFixed(1)} / 5 ({reviewTotal} total)</p>
      {user?.role === 'renter' ? (
        canRate ? (
          <Card className="i3d-card space-y-2 p-3">
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
                setReviewNotice(null);
                if (!reviewForm.description.trim()) {
                  setReviewNotice({ type: 'error', message: 'Please add review description.' });
                  return;
                }
                try {
                  await api.post(`/api/stores/${storeId}/reviews`, { rating: reviewForm.rating, description: reviewForm.description.trim() });
                  const refreshed = await api.get<{ average_rating: number; total_reviews: number; reviews: StoreReview[] }>(`/api/stores/${storeId}/reviews`);
                  setStoreReviews(refreshed.reviews || []);
                  setReviewAverage(Number(refreshed.average_rating || 0));
                  setReviewTotal(Number(refreshed.total_reviews || 0));
                  setCanRate(false);
                  setRateReason('You already rated this store.');
                  setReviewForm({ rating: 5, description: '' });
                  setReviewNotice({ type: 'success', message: 'Rating submitted!' });
                  setTimeout(() => setReviewNotice(null), 5000);
                } catch (err: any) {
                  setReviewNotice({ type: 'error', message: err.message || 'Failed to submit rating.' });
                }
              }}
            >
              Submit Rating
            </Button>
            {reviewNotice && (
              <p className={cn(
                "text-[10px] font-medium mt-1",
                reviewNotice.type === 'success' ? "text-emerald-600" : "text-red-500"
              )}>
                {reviewNotice.message}
              </p>
            )}
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground">{rateReason || 'You can rate this store after your first successful transaction.'}</p>
        )
      ) : (
        <p className="text-xs text-muted-foreground">Login as renter to submit a rating.</p>
      )}
      <div className="mt-2 space-y-2">
        {storeReviews.slice(0, 5).map((review) => (
          <div key={review.id} className="rounded-xl border bg-muted/20 p-2">
            <p className="text-xs font-bold">{review.renter_name}</p>
            <p className="text-xs">Rating: {review.rating}/5</p>
            <p className="text-xs text-muted-foreground">{review.description}</p>
          </div>
        ))}
        {!storeReviews.length && <p className="text-xs text-muted-foreground">No reviews yet.</p>}
      </div>
    </>
  );

  const renderReportContent = () => (
    <>
      <p className="text-xs text-muted-foreground">
        Reports are reviewed by the super admin. Please include clear details.
      </p>
      <Button className="mt-3 w-full" variant="destructive" onClick={handleReportStore}>
        Report Store
      </Button>
      {reportNotice && (
        <p className="mt-2 text-[10px] font-medium text-red-500">{reportNotice.message}</p>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--tone-bg)] pb-10">
      <div className="relative h-48 overflow-hidden sm:h-64 md:h-72">
        <img
          src={store.banner_url || `https://picsum.photos/seed/banner-${store.id}/1920/600`}
          className="h-full w-full object-cover"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 w-full p-3 text-white sm:p-6">
          <div className="container mx-auto flex items-end gap-3 sm:gap-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-xl sm:h-24 sm:w-24 md:h-28 md:w-28">
              <img src={store.logo_url || `https://picsum.photos/seed/logo-${store.id}/200/200`} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            </div>
            <div className="mb-1 min-w-0">
              <h1 className="mb-1 truncate text-xl font-bold sm:text-3xl md:text-4xl">{store.name}</h1>
              <div className="mb-1 flex items-center gap-2 text-xs text-white/90 sm:text-sm">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> {reviewAverage.toFixed(1)} ({reviewTotal} review{reviewTotal === 1 ? '' : 's'})
              </div>
              <p className="line-clamp-2 max-w-xl text-xs text-white/80 sm:text-sm">{store.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-4 px-3 sm:mt-8 sm:px-4">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <aside className="w-full md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:w-64 md:shrink-0 md:overflow-y-auto md:pr-1 lg:w-72">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-3">
                <div className="md:hidden">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <ListFilter className="h-4 w-4" />
                    </span>
                    <span>Categories</span>
                  </div>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {availableCategories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'secondary' : 'ghost'}
                        className={cn(
                          'h-8 shrink-0 rounded-full px-3 text-xs font-bold',
                          selectedCategory === category ? 'bg-slate-900 text-white hover:bg-slate-900/90' : 'border border-slate-200 bg-slate-50'
                        )}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setCategoryMenuOpen((open) => !open)}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <ListFilter className="h-4 w-4" />
                      </span>
                      <span className="truncate">Categories</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="max-w-[9rem] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {selectedCategory}
                      </span>
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform', categoryMenuOpen && 'rotate-180')} />
                    </span>
                  </button>
                  {categoryMenuOpen ? (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {availableCategories.map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'secondary' : 'ghost'}
                          className="h-9 justify-start rounded-xl px-3 text-xs font-bold"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <span className="truncate">{category}</span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-slate-100 p-2 md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {branchCount ? (
                    <CompactFactChip
                      icon={<MapPin className="h-4 w-4" />}
                      label="Branches"
                      value={branchCount}
                      active={mobileStorePanel === 'branches'}
                      onClick={() => toggleMobilePanel('branches')}
                    />
                  ) : null}
                  {hasPaymentDetails ? (
                    <CompactFactChip
                      icon={<Receipt className="h-4 w-4" />}
                      label="Payment"
                      value={paymentBadge || 'Details'}
                      active={mobileStorePanel === 'payment'}
                      onClick={() => toggleMobilePanel('payment')}
                    />
                  ) : null}
                  <CompactFactChip
                    icon={<StoreIcon className="h-4 w-4" />}
                    label="Billing"
                    value={rentalBillingMode === 'calendar_day' ? 'Calendar' : '24-hour'}
                  />
                  {hasSocialLinks ? (
                    <CompactFactChip
                      icon={<Globe className="h-4 w-4" />}
                      label="Social"
                      value={`${socialLinkCount} link${socialLinkCount === 1 ? '' : 's'}`}
                      active={mobileStorePanel === 'social'}
                      onClick={() => toggleMobilePanel('social')}
                    />
                  ) : null}
                  <CompactFactChip
                    icon={<QrCode className="h-4 w-4" />}
                    label="QR"
                    value="Share"
                    active={mobileStorePanel === 'qr'}
                    onClick={() => toggleMobilePanel('qr')}
                  />
                  <CompactFactChip
                    icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}
                    label="Report"
                    value="Store"
                    onClick={handleReportStore}
                  />
                </div>
                {mobileStorePanel ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    {mobileStorePanel === 'branches' ? renderBranchesContent() : null}
                    {mobileStorePanel === 'payment' ? renderPaymentContent() : null}
                    {mobileStorePanel === 'social' ? renderSocialContent() : null}
                    {mobileStorePanel === 'qr' ? renderQrContent() : null}
                  </div>
                ) : null}
                {reportNotice ? <p className="px-1 pt-2 text-[10px] font-medium text-red-500">{reportNotice.message}</p> : null}
              </div>
              <div className="hidden md:block">
            {store.branches?.length ? (
              <CompactInfoPanel title="Branches" icon={<MapPin className="h-4 w-4" />} badge={`${store.branches.length}`}>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {store.branches.map((branch) => (
                    <div key={branch._id || branch.address} className="rounded-xl border bg-muted/20 p-2">
                      <p className="font-bold text-foreground">{branch.name || 'Branch'}</p>
                      <p className="mt-1 flex items-start gap-1">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                        <span className="line-clamp-2">{branch.address}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CompactInfoPanel>
            ) : null}
            {(store.payment_details || (store.payment_detail_images || []).length) ? (
              <CompactInfoPanel title="Payment Details" icon={<Receipt className="h-4 w-4" />} badge={(store.payment_detail_images || []).length ? `${store.payment_detail_images?.length} refs` : undefined}>
                {store.payment_details ? <p className="mb-2 max-h-28 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{store.payment_details}</p> : null}
                {(store.payment_detail_images || []).length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(store.payment_detail_images || []).map((url, index) => (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-muted/20 p-1.5">
                        <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-background sm:h-28">
                          <img src={url} alt={`Payment reference ${index + 1}`} className="h-full w-full object-contain" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}
              </CompactInfoPanel>
            ) : null}
            <CompactInfoPanel title="Billing Mode" icon={<StoreIcon className="h-4 w-4" />} badge={rentalBillingMode === 'calendar_day' ? 'Calendar' : '24-hour'}>
              {renderBillingContent()}
            </CompactInfoPanel>
            {(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.custom.length) ? (
              <CompactInfoPanel title="Social Links" icon={<Globe className="h-4 w-4" />}>
                <div className="flex flex-col gap-2 text-xs text-[var(--tone-text-muted)]">
                  {socialLinks.facebook ? (
                    <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.facebook} target="_blank" rel="noreferrer">
                      <Facebook className="h-4 w-4 shrink-0 text-blue-600" /> <span className="truncate">{socialLinks.facebook}</span>
                    </a>
                  ) : null}
                  {socialLinks.instagram ? (
                    <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.instagram} target="_blank" rel="noreferrer">
                      <Instagram className="h-4 w-4 shrink-0 text-pink-600" /> <span className="truncate">{socialLinks.instagram}</span>
                    </a>
                  ) : null}
                  {socialLinks.tiktok ? (
                    <a className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={socialLinks.tiktok} target="_blank" rel="noreferrer">
                      <Music2 className="h-4 w-4 shrink-0 text-slate-900" /> <span className="truncate">{socialLinks.tiktok}</span>
                    </a>
                  ) : null}
                  {socialLinks.custom.map((link, index) => (
                    <a key={`${link}-${index}`} className="flex w-full items-center gap-2 overflow-hidden font-medium transition-colors hover:text-[var(--tone-accent)]" href={link} target="_blank" rel="noreferrer">
                      <Globe className="h-4 w-4 shrink-0 text-slate-600" /> <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </CompactInfoPanel>
            ) : null}
            <CompactInfoPanel title="Store QR" icon={<QrCode className="h-4 w-4" />}>
              {storeQrUrl ? (
                <div className="flex items-center gap-3">
                  <img src={storeQrUrl} alt="Store QR code" className="h-24 w-24 shrink-0 rounded-xl border bg-white p-1.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Scan to open this store page.</p>
                    {storePublicLink ? (
                      <div className="mt-2 min-w-0">
                        <code className="block truncate rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-700">{storePublicLink}</code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 rounded-full px-3"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(storePublicLink);
                              alert('Store link copied.');
                            } catch {
                              alert('Unable to copy. Please copy manually.');
                            }
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    ) : null}
                    <a href={storeQrUrl} download={`store-${storeId}-qr.png`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 underline">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{storeQrError || 'QR code unavailable.'}</p>
              )}
            </CompactInfoPanel>
            <CompactInfoPanel title="Store Ratings" icon={<Star className="h-4 w-4 text-yellow-500" />} badge={`${reviewAverage.toFixed(1)}`}>
              <p className="mb-2 text-xs text-muted-foreground">Average: {reviewAverage.toFixed(1)} / 5 ({reviewTotal} total)</p>
              {user?.role === 'renter' ? (
                canRate ? (
                  <Card className="i3d-card space-y-2 p-3">
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
                        setReviewNotice(null);
                        if (!reviewForm.description.trim()) {
                          setReviewNotice({ type: 'error', message: 'Please add review description.' });
                          return;
                        }
                        try {
                          await api.post(`/api/stores/${storeId}/reviews`, { rating: reviewForm.rating, description: reviewForm.description.trim() });
                          const refreshed = await api.get<{ average_rating: number; total_reviews: number; reviews: StoreReview[] }>(`/api/stores/${storeId}/reviews`);
                          setStoreReviews(refreshed.reviews || []);
                          setReviewAverage(Number(refreshed.average_rating || 0));
                          setReviewTotal(Number(refreshed.total_reviews || 0));
                          setCanRate(false);
                          setRateReason('You already rated this store.');
                          setReviewForm({ rating: 5, description: '' });
                          setReviewNotice({ type: 'success', message: 'Rating submitted!' });
                          setTimeout(() => setReviewNotice(null), 5000);
                        } catch (err: any) {
                          setReviewNotice({ type: 'error', message: err.message || 'Failed to submit rating.' });
                        }
                      }}
                    >
                      Submit Rating
                    </Button>
                    {reviewNotice && (
                      <p className={cn(
                        "text-[10px] font-medium mt-1",
                        reviewNotice.type === 'success' ? "text-emerald-600" : "text-red-500"
                      )}>
                        {reviewNotice.message}
                      </p>
                    )}
                  </Card>
                ) : (
                  <p className="text-xs text-muted-foreground">{rateReason || 'You can rate this store after your first successful transaction.'}</p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">Login as renter to submit a rating.</p>
              )}
              <div className="mt-2 space-y-2">
                {storeReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="rounded-xl border bg-muted/20 p-2">
                    <p className="text-xs font-bold">{review.renter_name}</p>
                    <p className="text-xs">Rating: {review.rating}/5</p>
                    <p className="text-xs text-muted-foreground">{review.description}</p>
                  </div>
                ))}
                {!storeReviews.length && <p className="text-xs text-muted-foreground">No reviews yet.</p>}
              </div>
            </CompactInfoPanel>
            <CompactInfoPanel title="Report Store" icon={<ShieldAlert className="h-4 w-4 text-rose-500" />}>
              {renderReportContent()}
            </CompactInfoPanel>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:mb-4 md:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_minmax(16rem,22rem)] sm:items-center">
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900 sm:text-xl">Available Equipment</h2>
                  <div className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-500 sm:text-sm">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{store.address}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{visibleItems.length} item{visibleItems.length === 1 ? '' : 's'} shown</p>
                </div>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-10 rounded-full pl-9" placeholder="Search this store..." value={storeGearSearch} onChange={(event) => setStoreGearSearch(event.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => (
                <Card key={item.id} className="group i3d-card cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" onClick={() => onNavigateItem(item.id)}>
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={item.image_url || `https://picsum.photos/seed/item-${item.id}/400/400`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      alt={item.name}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-2.5 sm:p-3">
                    <h3 className="line-clamp-2 min-h-[2.25rem] text-xs font-extrabold leading-snug text-slate-900 sm:text-sm">{item.name}</h3>
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-500 sm:text-xs">{item.brand || item.category || 'Others'}</p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 sm:text-base">{formatPHP(item.daily_price)}</p>
                        <p className="truncate text-[10px] font-semibold text-blue-700">{rentalBillingModeLabel}</p>
                        <p className="text-[10px] text-slate-500">Stock: {Math.max(0, item.stock || 0)}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 shrink-0 rounded-full px-2 text-[10px] sm:px-3">
                        View
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
          <Card className="i3d-modal w-full max-w-lg space-y-4 p-5">
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
                error={reportFormError.subject}
                onChange={(event) => {
                  setReportForm((prev) => ({ ...prev, subject: event.target.value }));
                  setReportFormError(prev => ({ ...prev, subject: '' }));
                }}
                placeholder="Short summary of the issue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                className={cn(
                  "min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  reportFormError.message ? "border-red-500" : "border-input"
                )}
                value={reportForm.message}
                onChange={(event) => {
                  setReportForm((prev) => ({ ...prev, message: event.target.value }));
                  setReportFormError(prev => ({ ...prev, message: '' }));
                }}
                placeholder="Describe the problem in detail."
              />
              {reportFormError.message && (
                <p className="text-[10px] font-medium text-red-500">{reportFormError.message}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={reportSending}
                onClick={async () => {
                  setReportFormError({});
                  const errs: { subject?: string; message?: string } = {};
                  if (!reportForm.subject.trim()) errs.subject = 'Subject is required.';
                  if (!reportForm.message.trim()) errs.message = 'Message is required.';
                  
                  if (Object.keys(errs).length > 0) {
                    setReportFormError(errs);
                    return;
                  }
                  try {
                    setReportSending(true);
                    await api.post(`/api/stores/${storeId}/report`, {
                      subject: reportForm.subject.trim(),
                      message: reportForm.message.trim(),
                    });
                    setReportNotice({ type: 'success', message: 'Report submitted. The admin will review it.' });
                    setReportOpen(false);
                    setReportForm({ subject: '', message: '' });
                  } catch (err: any) {
                    setReportNotice({ type: 'error', message: err.message || 'Failed to submit report.' });
                  } finally {
                    setReportSending(false);
                    setTimeout(() => setReportNotice(null), 5000);
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
