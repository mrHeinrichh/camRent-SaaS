import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Ban, CalendarDays, CalendarRange, Camera, ChevronRight, Clock3, CreditCard, Download, ExternalLink, FileText, Globe, Mail, MapPin, MessageSquare, Package, Pencil, Phone, Send, ShieldAlert, Trash2, Truck, User } from 'lucide-react';
import { PeriodCalendar } from '@/src/components/PeriodCalendar';
import { Button, Card, Input, cn } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import { api } from '@/src/lib/api';
import type { FraudListEntry, Item, ManualBlock, OwnerApplication, OwnerDashboardData, RentalFormField, SupportTicket } from '@/src/types/domain';
import type { OwnerTab } from '@/src/features/owner-dashboard/types';

interface OwnerTabsProps {
  activeTab: OwnerTab;
  data: OwnerDashboardData;
  applications: OwnerApplication[];
  pieSlices: Array<{ label: string; value: number; color: string; path: string }>;
  displayApprovedDate: string | null;
  onExportOverview: () => void;
  onExportCustomers: () => void;
  onExportTransactions: () => void;
  onExportInventory: () => void;
  onExportFraud: () => void;
  onSelectApplication: (application: OwnerApplication) => void;
  onSelectReportCustomer: (customer: { renter_name: string; renter_email: string; renter_phone: string }) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReportFraud: (id: string) => void;
  onCancelBooking: (id: string) => void;
  inventory: Item[];
  categories: string[];
  categoryFilter: string;
  onChangeCategoryFilter: (value: string) => void;
  filteredInventory: Item[];
  onOpenCreateEditor: () => void;
  onOpenEditEditor: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onToggleItemAvailability: (itemId: string, value: boolean) => void;
  onOpenBlockModal: (item: Item) => void;
  calendarLoading: boolean;
  selectedCalendarItemId: string;
  onChangeSelectedCalendarItemId: (id: string) => void;
  onRefreshCalendar: () => void;
  calendarItems: Item[];
  availabilityByItem: Record<string, { bookings: Array<{ start_date: string; end_date: string; status: string; renter_name?: string }>; manualBlocks: ManualBlock[] }>;
  rentalFormFields: RentalFormField[];
  rentalFormSettings: {
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  };
  referenceImageFile: File | null;
  onReferenceImageFileChange: (file: File | null) => void;
  onRentalFormSettingsChange: (next: {
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  }) => void;
  onAddCustomField: () => void;
  onUpdateCustomField: (index: number, patch: Partial<RentalFormField>) => void;
  onRemoveCustomField: (index: number) => void;
  onSaveCustomForm: () => void;
  fraudEntries: FraudListEntry[];
  fraudAccessError: string | null;
  fraudManual: { full_name: string; email: string; contact_number: string };
  fraudScope: 'internal' | 'global';
  fraudReason: string;
  onFraudManualChange: (next: { full_name: string; email: string; contact_number: string }) => void;
  onFraudScopeChange: (value: 'internal' | 'global') => void;
  onFraudReasonChange: (value: string) => void;
  onFraudEvidenceFileChange: (file: File | null) => void;
  onSubmitManualFraud: () => void;
  supportTickets: SupportTicket[];
  onCreateSupportTicket: (payload: { type: SupportTicket['type']; priority: SupportTicket['priority']; subject: string; message: string }) => Promise<void>;
  onUpdateSupportTicket: (id: string, payload: { type?: SupportTicket['type']; priority?: SupportTicket['priority']; subject?: string; message?: string; status?: SupportTicket['status'] }) => Promise<void>;
  onDeleteSupportTicket: (id: string) => Promise<void>;
  onSaveStoreProfile: (payload: {
    name: string;
    description: string;
    address: string;
    logo_url?: string;
    banner_url?: string;
    facebook_url: string;
    instagram_url: string;
    payment_details: string;
    payment_detail_images?: string[];
    branches?: Array<{ name?: string; address: string; location_lat?: number | null; location_lng?: number | null }>;
    location_lat?: number | null;
    location_lng?: number | null;
  }) => Promise<void>;
}

export function OwnerTabs({
  activeTab,
  data,
  applications,
  pieSlices,
  displayApprovedDate,
  onExportOverview,
  onExportCustomers,
  onExportTransactions,
  onExportInventory,
  onExportFraud,
  onSelectApplication,
  onSelectReportCustomer,
  inventory,
  categories,
  categoryFilter,
  onChangeCategoryFilter,
  filteredInventory,
  onOpenCreateEditor,
  onOpenEditEditor,
  onDeleteItem,
  onToggleItemAvailability,
  onOpenBlockModal,
  calendarLoading,
  selectedCalendarItemId,
  onChangeSelectedCalendarItemId,
  onRefreshCalendar,
  calendarItems,
  availabilityByItem,
  rentalFormFields,
  rentalFormSettings,
  referenceImageFile,
  onReferenceImageFileChange,
  onRentalFormSettingsChange,
  onAddCustomField,
  onUpdateCustomField,
  onRemoveCustomField,
  onSaveCustomForm,
  fraudEntries,
  fraudAccessError,
  fraudManual,
  fraudScope,
  fraudReason,
  onFraudManualChange,
  onFraudScopeChange,
  onFraudReasonChange,
  onFraudEvidenceFileChange,
  onSubmitManualFraud,
  supportTickets,
  onCreateSupportTicket,
  onUpdateSupportTicket,
  onDeleteSupportTicket,
  onSaveStoreProfile,
}: OwnerTabsProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; sourceUrl: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [expandedCustomerEmail, setExpandedCustomerEmail] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [paymentDetailImageFiles, setPaymentDetailImageFiles] = useState<File[]>([]);
  const [paymentDetailImageUrls, setPaymentDetailImageUrls] = useState<string[]>([]);
  const [storeBranches, setStoreBranches] = useState<Array<{ name: string; address: string; location_lat: string; location_lng: string }>>([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ name: string; lat: string; lon: string }>>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [branchLocationQueries, setBranchLocationQueries] = useState<Record<number, string>>({});
  const [branchSearchLoading, setBranchSearchLoading] = useState<Record<number, boolean>>({});
  const [branchSearchResults, setBranchSearchResults] = useState<Record<number, Array<{ name: string; lat: string; lon: string }>>>({});
  const [branchLocationLoading, setBranchLocationLoading] = useState<Record<number, boolean>>({});
  const [supportForm, setSupportForm] = useState<{ type: SupportTicket['type']; priority: SupportTicket['priority']; subject: string; message: string }>({
    type: 'feedback',
    priority: 'medium',
    subject: '',
    message: '',
  });
  const [editingSupportId, setEditingSupportId] = useState<string | null>(null);
  const [supportBusy, setSupportBusy] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [storeProfileForm, setStoreProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    logo_url: '',
    banner_url: '',
    facebook_url: '',
    instagram_url: '',
    payment_details: '',
    location_lat: '',
    location_lng: '',
  });

  useEffect(() => {
    setStoreProfileForm({
      name: data.store?.name || '',
      description: data.store?.description || '',
      address: data.store?.address || '',
      logo_url: data.store?.logo_url || '',
      banner_url: data.store?.banner_url || '',
      facebook_url: data.store?.facebook_url || '',
      instagram_url: data.store?.instagram_url || '',
      payment_details: data.store?.payment_details || '',
      location_lat: data.store?.location_lat != null ? String(data.store.location_lat) : '',
      location_lng: data.store?.location_lng != null ? String(data.store.location_lng) : '',
    });
    setPaymentDetailImageUrls(data.store?.payment_detail_images || []);
    setPaymentDetailImageFiles([]);
    setStoreBranches(
      (data.store?.branches || []).map((branch, index) => ({
        name: (branch.name || '').trim() || (index === 0 ? 'Main Branch' : ''),
        address: branch.address || '',
        location_lat: branch.location_lat != null ? String(branch.location_lat) : '',
        location_lng: branch.location_lng != null ? String(branch.location_lng) : '',
      })),
    );
  }, [data.store?.id, data.store?.name, data.store?.description, data.store?.address, data.store?.logo_url, data.store?.banner_url, data.store?.facebook_url, data.store?.instagram_url, data.store?.payment_details, data.store?.payment_detail_images, data.store?.branches, data.store?.location_lat, data.store?.location_lng]);

  const itemColorMap = useMemo(() => {
    const palette = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16'];
    const map = new Map<string, string>();
    inventory.forEach((item, index) => {
      map.set(item.id, palette[index % palette.length]);
    });
    return map;
  }, [inventory]);

  const mostRentedCamera = useMemo(() => {
    return (data.ownerAnalytics?.mostRentedCameras || []).slice(0, 6);
  }, [data.ownerAnalytics?.mostRentedCameras]);
  const topRentersOfMonth = useMemo(() => {
    return (data.ownerAnalytics?.topRentersOfMonth || []).slice(0, 6);
  }, [data.ownerAnalytics?.topRentersOfMonth]);
  const gearImageByName = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((item) => {
      if (item.name?.trim() && item.image_url?.trim()) {
        map.set(item.name.trim().toLowerCase(), item.image_url);
      }
    });
    return map;
  }, [inventory]);
  const getGearImage = (name: string) => gearImageByName.get(String(name || '').trim().toLowerCase()) || '';
  const getStatusBadgeClass = (status: string) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized.includes('APPROVED')) return 'bg-emerald-100 text-emerald-700';
    if (normalized.includes('PENDING') || normalized.includes('REVIEW') || normalized.includes('RESERVED')) return 'bg-amber-100 text-amber-700';
    if (normalized.includes('REJECTED') || normalized.includes('CANCEL')) return 'bg-rose-100 text-rose-700';
    return 'bg-muted text-muted-foreground';
  };
  const resolveFileAccess = async (url: string) => {
    const result = await api.get<{ view_url: string; download_url: string; request_id?: string }>(`/api/upload/public/access?url=${encodeURIComponent(url)}`);
    console.log('[owner/file] access resolved', { sourceUrl: url, viewUrl: result.view_url, downloadUrl: result.download_url, requestId: result.request_id });
    return result;
  };
  const downloadFile = async (url: string, fallbackName: string) => {
    try {
      setFileLoading(true);
      const access = await resolveFileAccess(url);
      const response = await fetch(access.download_url);
      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = body?.detail || body?.error || '';
          console.error('[owner/file] download failed', { status: response.status, detail, requestId: body?.request_id, sourceUrl: url });
        } catch {
          // ignore
        }
        throw new Error(`Download failed (${response.status})${detail ? `: ${detail}` : ''}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fallbackName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      alert(error?.message || 'Unable to download file.');
    } finally {
      setFileLoading(false);
    }
  };

  const getMapSrc = (latRaw: string, lngRaw: string) => {
    const lat = Number.parseFloat(latRaw);
    const lng = Number.parseFloat(lngRaw);
    const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    if (!valid) return '';
    const minLng = Math.max(-180, lng - 0.015);
    const maxLng = Math.min(180, lng + 0.015);
    const minLat = Math.max(-90, lat - 0.01);
    const maxLat = Math.min(90, lat + 0.01);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  const updateStoreBranch = (index: number, key: 'name' | 'address' | 'location_lat' | 'location_lng', value: string) => {
    setStoreBranches((previous) => previous.map((branch, currentIndex) => (currentIndex === index ? { ...branch, [key]: value } : branch)));
  };

  const addStoreBranch = () => setStoreBranches((previous) => [...previous, { name: '', address: '', location_lat: '', location_lng: '' }]);
  const removeStoreBranch = (index: number) => setStoreBranches((previous) => previous.filter((_, currentIndex) => currentIndex !== index));

  const fillWithCurrentLocation = (branchIndex: number | null) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not available in this browser.');
      return;
    }
    if (branchIndex === null) setLocationLoading(true);
    if (branchIndex !== null) setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: true }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        if (branchIndex === null) {
          setStoreProfileForm((prev) => ({ ...prev, location_lat: lat, location_lng: lng }));
          setLocationLoading(false);
          return;
        }
        updateStoreBranch(branchIndex, 'location_lat', lat);
        updateStoreBranch(branchIndex, 'location_lng', lng);
        setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: false }));
      },
      async (error) => {
        if (branchIndex === null) setLocationLoading(false);
        if (branchIndex !== null) setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: false }));
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) throw new Error(`IP lookup failed with status ${response.status}`);
          const dataIp = (await response.json()) as { latitude?: number; longitude?: number };
          if (!Number.isFinite(dataIp.latitude) || !Number.isFinite(dataIp.longitude)) throw new Error('IP lookup returned invalid coordinates');
          const lat = Number(dataIp.latitude).toFixed(6);
          const lng = Number(dataIp.longitude).toFixed(6);
          if (branchIndex === null) setStoreProfileForm((prev) => ({ ...prev, location_lat: lat, location_lng: lng }));
          else {
            updateStoreBranch(branchIndex, 'location_lat', lat);
            updateStoreBranch(branchIndex, 'location_lng', lng);
          }
          alert('Precise GPS location unavailable. Using approximate location based on your network.');
          return;
        } catch {
          alert(error.message || 'Unable to get your current location.');
        }
      },
    );
  };

  const searchLocationByName = async (branchIndex: number | null) => {
    const query = (branchIndex === null ? locationQuery : branchLocationQueries[branchIndex] || '').trim();
    if (!query) return;
    if (branchIndex === null) {
      setLocationSearchLoading(true);
      setLocationSearchResults([]);
    } else {
      setBranchSearchLoading((prev) => ({ ...prev, [branchIndex]: true }));
      setBranchSearchResults((prev) => ({ ...prev, [branchIndex]: [] }));
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
      const dataSearch = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      const mapped = dataSearch.map((item) => ({ name: item.display_name, lat: item.lat, lon: item.lon }));
      if (branchIndex === null) setLocationSearchResults(mapped);
      else setBranchSearchResults((prev) => ({ ...prev, [branchIndex]: mapped }));
    } catch (error: any) {
      alert(error?.message || 'Failed to search location by name.');
    } finally {
      if (branchIndex === null) setLocationSearchLoading(false);
      else setBranchSearchLoading((prev) => ({ ...prev, [branchIndex]: false }));
    }
  };

  return (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Store Overview</h1>
            <Button variant="outline" onClick={onExportOverview}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <Card className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Registered Store</p>
                <h2 className="text-2xl font-bold">{data.store?.name || 'Unnamed Store'}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setProfileEditMode((prev) => !prev)} title={profileEditMode ? 'Close edit mode' : 'Edit store profile'}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold uppercase',
                    data.store?.status === 'approved' ? 'bg-green-100 text-green-700' : data.store?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
                  )}
                >
                  {data.store?.status || 'unknown'}
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border bg-muted/30">
              <div className="relative h-48 w-full">
                <img src={bannerImageFile ? URL.createObjectURL(bannerImageFile) : storeProfileForm.banner_url || 'https://picsum.photos/seed/store-cover/1200/500'} alt="Store cover" className="h-full w-full object-cover" />
                {profileEditMode ? (
                  <>
                    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => setBannerImageFile(event.target.files?.[0] ?? null)} />
                    <Button type="button" variant="secondary" size="icon" className="absolute bottom-3 right-3" onClick={() => bannerInputRef.current?.click()} title="Edit cover photo">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-4 px-4 pb-4">
                <div className="-mt-12">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-muted shadow">
                    <img src={logoImageFile ? URL.createObjectURL(logoImageFile) : storeProfileForm.logo_url || 'https://picsum.photos/seed/store-logo/400/400'} alt="Store logo" className="h-full w-full object-cover" />
                    {profileEditMode ? (
                      <>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => setLogoImageFile(event.target.files?.[0] ?? null)} />
                        <Button type="button" variant="secondary" size="icon" className="absolute bottom-1 right-1 h-7 w-7 rounded-full" onClick={() => logoInputRef.current?.click()} title="Edit logo">
                          <Camera className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="pb-1">
                  <p className="text-lg font-bold">{storeProfileForm.name || 'Unnamed Store'}</p>
                  <p className="text-sm text-muted-foreground">{storeProfileForm.address || 'No address yet'}</p>
                </div>
              </div>
            </div>

            {profileEditMode ? (
              <div className="space-y-4 rounded-lg border border-dashed p-4">
                <p className="text-sm font-semibold">Edit Store Profile</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <Input value={storeProfileForm.name} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, name: event.target.value }))} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Address</span>
                    <Input value={storeProfileForm.address} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, address: event.target.value }))} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Facebook URL</span>
                    <Input value={storeProfileForm.facebook_url} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, facebook_url: event.target.value }))} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Instagram URL</span>
                    <Input value={storeProfileForm.instagram_url} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, instagram_url: event.target.value }))} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Location Latitude</span>
                    <Input value={storeProfileForm.location_lat} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, location_lat: event.target.value }))} />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="text-xs text-muted-foreground">Location Longitude</span>
                    <Input value={storeProfileForm.location_lng} onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, location_lng: event.target.value }))} />
                  </label>
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-xs text-muted-foreground">Store Pin (Geo Map)</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => fillWithCurrentLocation(null)} disabled={locationLoading}>
                        {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                      </Button>
                      <Input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search place name" />
                      <Button type="button" variant="outline" size="sm" onClick={() => searchLocationByName(null)} disabled={locationSearchLoading}>
                        {locationSearchLoading ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                    {locationSearchResults.length ? (
                      <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-2">
                        {locationSearchResults.map((result, index) => (
                          <button
                            key={`${result.lat}-${result.lon}-${index}`}
                            type="button"
                            className="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                            onClick={() => {
                              setStoreProfileForm((prev) => ({ ...prev, location_lat: Number.parseFloat(result.lat).toFixed(6), location_lng: Number.parseFloat(result.lon).toFixed(6) }));
                              setLocationQuery(result.name);
                              setLocationSearchResults([]);
                            }}
                          >
                            {result.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {getMapSrc(storeProfileForm.location_lat, storeProfileForm.location_lng) ? (
                      <iframe title="Store location" src={getMapSrc(storeProfileForm.location_lat, storeProfileForm.location_lng)} className="h-40 w-full rounded-md border" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    ) : null}
                  </div>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="text-xs text-muted-foreground">Description</span>
                    <textarea
                      className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={storeProfileForm.description}
                      onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-1 text-sm md:col-span-2">
                    <span className="text-xs text-muted-foreground">Payment Details</span>
                    <textarea
                      className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={storeProfileForm.payment_details}
                      onChange={(event) => setStoreProfileForm((prev) => ({ ...prev, payment_details: event.target.value }))}
                    />
                  </label>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Payment QR / Reference Images</span>
                      <Input type="file" accept="image/*" multiple className="max-w-xs" onChange={(event) => setPaymentDetailImageFiles(Array.from(event.target.files || []))} />
                    </div>
                    {(paymentDetailImageUrls.length || paymentDetailImageFiles.length) ? (
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                        {paymentDetailImageUrls.map((url, index) => (
                          <div key={`${url}-${index}`} className="relative overflow-hidden rounded border">
                            <img src={url} alt={`Payment detail ${index + 1}`} className="h-20 w-full object-cover" />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute right-1 top-1 h-6 px-2 text-[10px]"
                              onClick={() => setPaymentDetailImageUrls((prev) => prev.filter((_, current) => current !== index))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {paymentDetailImageFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="overflow-hidden rounded border">
                            <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Branches</p>
                      <Button type="button" variant="outline" size="sm" onClick={addStoreBranch}>Add Branch</Button>
                    </div>
                    <div className="space-y-3">
                      {storeBranches.map((branch, index) => (
                        <div key={`owner-branch-${index}`} className="space-y-2 rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground">{index === 0 ? 'Main Branch' : `Branch ${index + 1}`}</p>
                            {index > 0 ? (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeStoreBranch(index)}>
                                Remove
                              </Button>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <Input placeholder="Branch Name" value={branch.name} onChange={(event) => updateStoreBranch(index, 'name', event.target.value)} />
                            <Input placeholder="Branch Address" value={branch.address} onChange={(event) => updateStoreBranch(index, 'address', event.target.value)} />
                            <Input placeholder="Latitude" value={branch.location_lat} onChange={(event) => updateStoreBranch(index, 'location_lat', event.target.value)} />
                            <Input placeholder="Longitude" value={branch.location_lng} onChange={(event) => updateStoreBranch(index, 'location_lng', event.target.value)} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => fillWithCurrentLocation(index)} disabled={Boolean(branchLocationLoading[index])}>
                              {branchLocationLoading[index] ? 'Getting Location...' : 'Use Current Location'}
                            </Button>
                            <Input value={branchLocationQueries[index] || ''} onChange={(event) => setBranchLocationQueries((prev) => ({ ...prev, [index]: event.target.value }))} placeholder="Search place name" />
                            <Button type="button" variant="outline" size="sm" onClick={() => searchLocationByName(index)} disabled={Boolean(branchSearchLoading[index])}>
                              {branchSearchLoading[index] ? 'Searching...' : 'Search'}
                            </Button>
                          </div>
                          {(branchSearchResults[index] || []).length > 0 ? (
                            <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-2">
                              {(branchSearchResults[index] || []).map((result, resultIndex) => (
                                <button
                                  key={`${result.lat}-${result.lon}-${resultIndex}`}
                                  type="button"
                                  className="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                                  onClick={() => {
                                    updateStoreBranch(index, 'location_lat', Number.parseFloat(result.lat).toFixed(6));
                                    updateStoreBranch(index, 'location_lng', Number.parseFloat(result.lon).toFixed(6));
                                    setBranchLocationQueries((prev) => ({ ...prev, [index]: result.name }));
                                    setBranchSearchResults((prev) => ({ ...prev, [index]: [] }));
                                  }}
                                >
                                  {result.name}
                                </button>
                              ))}
                            </div>
                          ) : null}
                          {getMapSrc(branch.location_lat, branch.location_lng) ? (
                            <iframe title={`Owner Branch ${index + 1}`} src={getMapSrc(branch.location_lat, branch.location_lng)} className="h-40 w-full rounded-md border" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setProfileEditMode(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        console.log('[owner/profile] save start', {
                          hasLogoFile: Boolean(logoImageFile),
                          hasBannerFile: Boolean(bannerImageFile),
                          paymentImageFiles: paymentDetailImageFiles.length,
                          branches: storeBranches.length,
                        });
                        setProfileSaving(true);
                        const parsedBranches = storeBranches
                          .map((branch, index) => ({
                            name: (branch.name || '').trim() || (index === 0 ? 'Main Branch' : ''),
                            address: (branch.address || '').trim(),
                            location_lat: (branch.location_lat || '').trim(),
                            location_lng: (branch.location_lng || '').trim(),
                          }))
                          .filter((branch) => branch.address);
                        const hasInvalidBranch = parsedBranches.some((branch) => !Number.isFinite(Number(branch.location_lat)) || !Number.isFinite(Number(branch.location_lng)));
                        if (hasInvalidBranch) {
                          alert('Each branch must have a valid pin location.');
                          return;
                        }
                        let nextLogoUrl = storeProfileForm.logo_url;
                        let nextBannerUrl = storeProfileForm.banner_url;
                        let nextPaymentImageUrls = [...paymentDetailImageUrls];
                        if (logoImageFile) {
                          const form = new FormData();
                          form.append('file', logoImageFile);
                          const upload = await api.post<{ url: string }>('/api/upload/public', form);
                          nextLogoUrl = upload.url;
                        }
                        if (bannerImageFile) {
                          const form = new FormData();
                          form.append('file', bannerImageFile);
                          const upload = await api.post<{ url: string }>('/api/upload/public', form);
                          nextBannerUrl = upload.url;
                        }
                        if (paymentDetailImageFiles.length) {
                          const uploaded = await Promise.all(
                            paymentDetailImageFiles.map(async (file) => {
                              const form = new FormData();
                              form.append('file', file);
                              const upload = await api.post<{ url: string }>('/api/upload/public', form);
                              return upload.url;
                            }),
                          );
                          nextPaymentImageUrls = [...nextPaymentImageUrls, ...uploaded];
                        }
                        await onSaveStoreProfile({
                          name: storeProfileForm.name,
                          description: storeProfileForm.description,
                          address: storeProfileForm.address,
                          logo_url: nextLogoUrl,
                          banner_url: nextBannerUrl,
                          facebook_url: storeProfileForm.facebook_url,
                          instagram_url: storeProfileForm.instagram_url,
                          payment_details: storeProfileForm.payment_details,
                          payment_detail_images: nextPaymentImageUrls,
                          branches: parsedBranches.map((branch) => ({
                            name: branch.name,
                            address: branch.address,
                            location_lat: Number(branch.location_lat),
                            location_lng: Number(branch.location_lng),
                          })),
                          location_lat: storeProfileForm.location_lat.trim() ? Number(storeProfileForm.location_lat) : null,
                          location_lng: storeProfileForm.location_lng.trim() ? Number(storeProfileForm.location_lng) : null,
                        });
                        setStoreProfileForm((prev) => ({ ...prev, logo_url: nextLogoUrl, banner_url: nextBannerUrl }));
                        setPaymentDetailImageUrls(nextPaymentImageUrls);
                        setPaymentDetailImageFiles([]);
                        setLogoImageFile(null);
                        setBannerImageFile(null);
                        setProfileEditMode(false);
                        console.log('[owner/profile] save success');
                      } catch (error: any) {
                        console.error('[owner/profile] save failed', {
                          message: error?.message,
                          stack: error?.stack,
                        });
                        throw error;
                      } finally {
                        setProfileSaving(false);
                      }
                    }}
                    disabled={profileSaving}
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p><span className="font-semibold">Name:</span> {storeProfileForm.name || '-'}</p>
                <p><span className="font-semibold">Address:</span> {storeProfileForm.address || '-'}</p>
                <p><span className="font-semibold">Facebook:</span> {storeProfileForm.facebook_url || '-'}</p>
                <p><span className="font-semibold">Instagram:</span> {storeProfileForm.instagram_url || '-'}</p>
                <p><span className="font-semibold">Location:</span> {storeProfileForm.location_lat || '-'}, {storeProfileForm.location_lng || '-'}</p>
                <p><span className="font-semibold">Payment Details:</span> {storeProfileForm.payment_details || '-'}</p>
                <p className="md:col-span-2"><span className="font-semibold">Description:</span> {storeProfileForm.description || '-'}</p>
                <div className="md:col-span-2">
                  <p className="font-semibold">Payment QR / Reference Images:</p>
                  {paymentDetailImageUrls.length ? (
                    <div className="mt-1 grid grid-cols-2 gap-2 md:grid-cols-6">
                      {paymentDetailImageUrls.map((url, index) => (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border">
                          <img src={url} alt={`Payment reference ${index + 1}`} className="h-60 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No payment images uploaded.</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold">Branches:</p>
                  {storeBranches.length ? (
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {storeBranches.map((branch, index) => (
                        <li key={`branch-display-${index}`}>
                          {(branch.name || `Branch ${index + 1}`)}: {branch.address || '-'} ({branch.location_lat || '-'}, {branch.location_lng || '-'})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No branches configured.</p>
                  )}
                </div>
                {displayApprovedDate ? <p><span className="font-semibold">Approved Date:</span> {format(parseISO(displayApprovedDate), 'MMM dd, yyyy')}</p> : null}
                {data.store?.payment_due_date ? <p><span className="font-semibold">Due Date:</span> {format(parseISO(data.store.payment_due_date), 'MMM dd, yyyy')}</p> : null}
              </div>
            )}
            {data.store?.status === 'approved' ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Your approved date is your due date. Monthly advance payment is recommended to avoid account inactivity.
              </p>
            ) : null}
            {data.store?.status === 'pending' ? (
              <p className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                Pending stores are still being reviewed, Once approved you will receive an email notification, and your store will be visible on the platform. In the meantime, you can prepare your inventory and get ready for rentals!
              </p>
            ) : null}
            {data.store?.status === 'pending' ? (
              <p className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                We are still currently working on automations of payment, However manual payment via Gcash or Bank will work as of the moment, Please message the owner of this website have your account approved or email him at mrheinrichhh@gmail.com or contact him at his number 09569749935 with your payment and your store details, thank you for your patience.
              </p>
            ) : null}
          </Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Rentals</p>
              <p className="text-3xl font-bold">{data.stats?.total_rentals || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">{formatPHP(data.stats?.total_revenue || 0)}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{applications.filter((app) => app.status === 'PENDING_REVIEW').length}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Customers</p>
              <p className="text-3xl font-bold">{data.ownerAnalytics?.totalCustomers || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Successful Rentals</p>
              <p className="text-3xl font-bold">{data.ownerAnalytics?.totalCustomersRented || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Profit (Successful Rentals)</p>
              <p className="text-3xl font-bold">{formatPHP(data.ownerAnalytics?.totalProfit || 0)}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold">Status Distribution (Pie)</h3>
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <svg viewBox="0 0 200 200" className="h-90 w-full">
                  {pieSlices.length ? pieSlices.map((slice) => <path key={slice.label} d={slice.path} fill={slice.color} />) : <circle cx="100" cy="100" r="80" fill="#e5e7eb" />}
                  <circle cx="100" cy="100" r="38" fill="white" />
                </svg>
                <div className="space-y-2 text-sm">
                  {pieSlices.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                      <span>{slice.label}</span>
                      <span className="font-semibold">{slice.value}</span>
                    </div>
                  ))}
                  {!pieSlices.length && <p className="text-muted-foreground">No status data yet.</p>}
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold">Peak Rental Dates (Bar)</h3>
              <div className="space-y-3">
                {(data.ownerAnalytics?.peakRentalDates || []).slice(0, 7).map((entry) => (
                  <div key={entry.date}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{entry.date}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-3 rounded bg-muted">
                      <div
                        className="h-3 rounded bg-emerald-500"
                        style={{ width: `${Math.min(100, (entry.count / Math.max(1, (data.ownerAnalytics?.peakRentalDates || [])[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!(data.ownerAnalytics?.peakRentalDates || []).length && <p className="text-sm text-muted-foreground">No peak date data yet.</p>}
              </div>
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold">Most Rented Camera (Bar)</h3>
            <div className="space-y-3">
              {mostRentedCamera.map((entry) => (
                <div key={entry.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{entry.name}</span>
                    <span>{entry.count}</span>
                  </div>
                  <div className="h-3 rounded bg-muted">
                    <div className="h-3 rounded bg-sky-500" style={{ width: `${Math.min(100, (entry.count / Math.max(1, mostRentedCamera[0]?.count || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              {!mostRentedCamera.length && <p className="text-sm text-muted-foreground">No approved camera transactions yet.</p>}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold">Top Renter of the Month</h3>
            <div className="space-y-3">
              {topRentersOfMonth.map((entry) => (
                <div key={`${entry.renter_email || entry.renter_name}`}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate">{entry.renter_name}</span>
                    <span>{entry.rentals} rentals</span>
                  </div>
                  <div className="h-3 rounded bg-muted">
                    <div className="h-3 rounded bg-indigo-500" style={{ width: `${Math.min(100, (entry.rentals / Math.max(1, topRentersOfMonth[0]?.rentals || 1)) * 100)}%` }} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{entry.renter_email || '-'} • {formatPHP(entry.amount || 0)}</p>
                </div>
              ))}
              {!topRentersOfMonth.length && <p className="text-sm text-muted-foreground">No top renter data this month yet.</p>}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-bold">Latest Store Ratings</h3>
            <div className="space-y-3">
              {(data.storeRatings || []).slice(0, 8).map((entry, index) => (
                <div key={`${entry.renter_name}-${entry.created_at}-${index}`} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{entry.renter_name}</span>
                    <span>{'★'.repeat(Math.max(1, Math.min(5, Math.round(entry.rating))))} ({entry.rating})</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                </div>
              ))}
              {!(data.storeRatings || []).length && <p className="text-sm text-muted-foreground">No ratings yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Customers</h1>
            <Button variant="outline" onClick={onExportCustomers}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <div className="space-y-4">
            {(data.customers || []).map((customer) => (
              <Card key={customer.renter_email} className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold">{customer.renter_name}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" /> {customer.renter_email}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" /> {customer.renter_phone}
                    </p>
                    {customer.renter_address ? (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {customer.renter_address}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{customer.transaction_count} transaction(s)</span>
                    <Button variant="outline" size="sm" onClick={() => setExpandedCustomerEmail((prev) => (prev === customer.renter_email ? null : customer.renter_email))}>
                      {expandedCustomerEmail === customer.renter_email ? 'Hide Rentals & Transactions' : 'Show Rentals & Transactions'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.store?.status !== 'approved'}
                      onClick={() => onSelectReportCustomer({ renter_name: customer.renter_name, renter_email: customer.renter_email, renter_phone: customer.renter_phone })}
                    >
                      Flag as Fraud
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submitted Requirements</p>
                  {(customer.requirements || []).length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(customer.requirements || []).map((requirement) => {
                        const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(requirement.url);
                        return (
                          <div key={`${customer.renter_email}-${requirement.type}`} className="rounded-xl border bg-muted/20 p-3">
                            <p className="mb-2 line-clamp-1 text-xs font-semibold text-muted-foreground">{requirement.type}</p>
                            {isImage ? (
                              <button type="button" className="h-90 w-full overflow-hidden rounded-lg border" onClick={() => setPreviewImageUrl(requirement.url)}>
                                <img src={requirement.url} alt={requirement.type} className="h-full w-full object-cover" />
                              </button>
                            ) : (
                              <div className="flex h-32 flex-col items-center justify-center rounded-lg border bg-white text-center">
                                <FileText className="mb-1 h-5 w-5 text-slate-600" />
                                <span className="px-1 text-xs font-semibold text-slate-700">{requirement.type}</span>
                              </div>
                            )}
                            {!isImage && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      setFileLoading(true);
                                      const access = await resolveFileAccess(requirement.url);
                                      setPreviewFile({ url: access.view_url, type: requirement.type, sourceUrl: requirement.url });
                                    } catch (error: any) {
                                      alert(error?.message || 'Unable to view file.');
                                    } finally {
                                      setFileLoading(false);
                                    }
                                  }}
                                  className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold"
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> View
                                </button>
                                <button type="button" onClick={() => downloadFile(requirement.url, `${requirement.type}.pdf`)} className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold">
                                  <Download className="mr-1 h-3 w-3" /> Download
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No requirements uploaded yet.</p>
                  )}
                </div>
                <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                  <p className="mb-2 inline-flex items-center gap-2 font-semibold">
                    <Package className="h-4 w-4 text-slate-600" /> Mostly rented gears
                  </p>
                  {customer.mostly_rented_gears.length ? (
                    <div className="flex flex-wrap gap-2">
                      {customer.mostly_rented_gears.map((gear) => (
                        <span key={`${customer.renter_email}-${gear.name}`} className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
                          <Camera className="h-3 w-3 text-sky-600" /> {gear.name} ({gear.count})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No rentals yet</p>
                  )}
                </div>
                {expandedCustomerEmail === customer.renter_email && (
                  <div className="space-y-4 rounded-xl border border-dashed p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarRange className="h-3 w-3" /> All Rentals & Transactions
                    </p>
                    {(customer.transactions || []).length ? (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {(customer.transactions || []).map((transaction) => (
                          <div key={transaction.id} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span className="inline-flex items-center gap-1 font-semibold">
                                <FileText className="h-3.5 w-3.5 text-slate-600" /> #{transaction.id.slice(0, 8)}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadgeClass(transaction.status)}`}>
                                {transaction.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                              <p className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" /> {format(parseISO(transaction.created_at), 'MMM dd, yyyy hh:mm a')}
                              </p>
                              <p className="inline-flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" /> Total: <span className="font-semibold text-slate-900">{formatPHP(transaction.total_amount)}</span>
                              </p>
                            </div>
                            <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                              {(transaction.items || []).length ? (
                                (transaction.items || []).map((item, itemIndex) => {
                                  const gearImage = getGearImage(item.name);
                                  return (
                                    <div key={`${transaction.id}-${item.name}-${itemIndex}`} className="rounded-xl border bg-white p-3">
                                      <div className="grid grid-cols-[3.2rem,1fr] gap-3">
                                      <div className="h-12 w-12 overflow-hidden rounded-md border bg-slate-100">
                                        {gearImage ? (
                                          <img src={gearImage} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center text-slate-500">
                                            <Camera className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                                        {item.description ? <p className="line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p> : null}
                                        <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                                          <p className="inline-flex items-center gap-1">
                                            <Package className="h-3 w-3" /> Quantity: {item.quantity || 1}
                                          </p>
                                          <p className="inline-flex items-center gap-1">
                                            <CalendarDays className="h-3 w-3" /> Start: {format(parseISO(item.start_date), 'MMM dd, yyyy')}
                                          </p>
                                          <p className="inline-flex items-center gap-1 sm:col-span-2">
                                            <ChevronRight className="h-3 w-3" /> End: {format(parseISO(item.end_date), 'MMM dd, yyyy')}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-muted-foreground">No item details</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No transactions found.</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
            {!(data.customers || []).length && <p className="text-sm text-muted-foreground">No customers yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Recent Transactions</h1>
            <Button variant="outline" onClick={onExportTransactions}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <div className="space-y-4">
            {(data.recentTransactions || []).map((transaction) => {
              const docs = (transaction.documents || []).filter((doc) => doc.url);
              return (
                <Card key={transaction.id} className="space-y-4 p-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold">{transaction.renter_name}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {transaction.renter_email}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" /> {transaction.renter_phone || '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">Present Address: {transaction.renter_address || '-'}</p>
                      <p className="text-sm text-muted-foreground">
                        Emergency Contact: {transaction.renter_emergency_contact_name || '-'} {transaction.renter_emergency_contact ? `(${transaction.renter_emergency_contact})` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <p className="text-xl font-bold">{formatPHP(transaction.total_amount)}</p>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{transaction.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="mb-1 inline-flex items-center gap-1 font-semibold"><MapPin className="h-3 w-3" /> Branch</p>
                      <p>{transaction.store_branch_name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{transaction.store_branch_address || '-'}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="mb-1 inline-flex items-center gap-1 font-semibold"><Truck className="h-3 w-3" /> Delivery</p>
                      <p className="capitalize">{transaction.delivery_mode || '-'}</p>
                      <p className="text-xs text-muted-foreground">Address: {transaction.delivery_address || '-'}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(transaction.created_at), 'MMM dd, yyyy hh:mm a')}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="mb-1 inline-flex items-center gap-1 font-semibold"><CreditCard className="h-3 w-3" /> Payment</p>
                      <p className="capitalize">{transaction.payment_mode || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        Rent Period: {transaction.start_date ? format(parseISO(transaction.start_date), 'MMM dd, yyyy') : '-'} to {transaction.end_date ? format(parseISO(transaction.end_date), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <CalendarRange className="h-3 w-3" /> Rented Gears
                      </p>
                      {(transaction.items || []).length ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {(transaction.items || []).map((item, index) => {
                            const gearImage = getGearImage(item.name);
                            return (
                              <div key={`${transaction.id}-${item.name}-${index}`} className="rounded-xl border bg-white p-3">
                                <div className="grid grid-cols-[3.5rem,1fr] gap-3">
                                <div className="h-90 w-80 overflow-hidden rounded-md border bg-slate-100">
                                  {gearImage ? (
                                    <img src={gearImage} alt={item.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                                      <Camera className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 space-y-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                                  {item.description ? <p className="line-clamp-2 text-[11px] text-muted-foreground">{item.description}</p> : null}
                                  <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                                    <p className="inline-flex items-center gap-1">
                                      <Package className="h-3.5 w-3.5" /> Quantity: {item.quantity || 1}
                                    </p>
                                    <p className="inline-flex items-center gap-1">
                                      <CalendarDays className="h-3.5 w-3.5" /> Start Rent: {format(parseISO(item.start_date), 'MMM dd, yyyy')}
                                    </p>
                                    <p className="inline-flex items-center gap-1">
                                      <ChevronRight className="h-3.5 w-3.5" /> End Rent: {format(parseISO(item.end_date), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No item details.</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <FileText className="h-3 w-3" /> Requirements (including billing address)
                      </p>
                      {docs.length ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {docs.map((doc, index) => {
                          const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(doc.url);
                          return (
                            <div key={`${transaction.id}-${doc.type}-${index}`} className="rounded-xl border bg-muted/20 p-3">
                              <p className="mb-2 line-clamp-1 text-[11px] font-semibold text-muted-foreground">{doc.type}</p>
                              {isImage ? (
                                <div className="space-y-2">
                                  <button type="button" className="h-100 w-full overflow-hidden rounded-lg border" onClick={() => setPreviewImageUrl(doc.url)}>
                                    <img src={doc.url} alt={doc.type} className="h-full w-full object-cover" />
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded border px-2 py-1.5 text-[10px] font-semibold">
                                      <ExternalLink className="mr-1 h-3 w-3" /> View
                                    </a>
                                    <button type="button" onClick={() => downloadFile(doc.url, `${doc.type}.jpg`)} className="flex items-center justify-center rounded border px-2 py-1.5 text-[10px] font-semibold">
                                      <Download className="mr-1 h-3 w-3" /> Download
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-24 flex-col items-center justify-center rounded-lg border bg-white text-center">
                                  <FileText className="mb-1 h-4 w-4 text-slate-600" />
                                  <span className="px-1 text-[10px] font-semibold text-slate-700">{doc.type}</span>
                                </div>
                              )}
                              {!isImage && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        setFileLoading(true);
                                        const access = await resolveFileAccess(doc.url);
                                        setPreviewFile({ url: access.view_url, type: doc.type, sourceUrl: doc.url });
                                      } catch (error: any) {
                                        alert(error?.message || 'Unable to view file.');
                                    } finally {
                                      setFileLoading(false);
                                    }
                                  }}
                                    className="flex items-center justify-center rounded border px-2 py-1.5 text-[10px] font-semibold"
                                  >
                                    <ExternalLink className="mr-1 h-3 w-3" /> View
                                  </button>
                                  <button type="button" onClick={() => downloadFile(doc.url, `${doc.type}.pdf`)} className="flex items-center justify-center rounded border px-2 py-1.5 text-[10px] font-semibold">
                                    <Download className="mr-1 h-3 w-3" /> Download
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No requirement files.</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
            {!(data.recentTransactions || []).length && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Rental Applications</h1>
          <div className="grid grid-cols-1 gap-4">
            {applications.map((application) => (
              <Card key={application.id} className="cursor-pointer space-y-3 p-5 transition-colors hover:bg-muted/10" onClick={() => onSelectApplication(application)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-full',
                        application.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' : application.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                      )}
                    >
                      <User className="h-6 w-6" />
                      {Boolean(application.fraud_flag) && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                          <ShieldAlert className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">{application.renter_name}</h3>
                      <p className="text-sm text-muted-foreground">{application.renter_email}</p>
                      <p className="text-sm text-muted-foreground">{application.renter_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold',
                        application.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' : application.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                      )}
                    >
                      {application.status.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="font-semibold">Items / Rent Range</p>
                    <p className="text-xs text-muted-foreground">
                      {application.items
                        .map((item) => `${item.name} (${format(parseISO(item.start_date), 'MMM dd')} - ${format(parseISO(item.end_date), 'MMM dd')})`)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="font-semibold">Payment / Delivery</p>
                    <p className="text-xs text-muted-foreground">{application.payment_mode || '-'}</p>
                    <p className="text-xs text-muted-foreground">{application.delivery_mode || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="font-semibold">Total / Requirements</p>
                    <p className="text-xs text-muted-foreground">{formatPHP(application.total_amount)}</p>
                    <p className="text-xs text-muted-foreground">{(application.documents || []).length} file(s) submitted</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Inventory</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExportInventory}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
              <Button onClick={onOpenCreateEditor} className="h-10 rounded-full px-5">
                Add New Gear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button key={category} size="sm" variant={categoryFilter === category ? 'secondary' : 'outline'} onClick={() => onChangeCategoryFilter(category)}>
                {category === 'all' ? 'All Gear' : category}
              </Button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Item</th>
                  <th className="p-4 text-sm font-semibold">Category</th>
                  <th className="p-4 text-sm font-semibold">Brand</th>
                  <th className="p-4 text-sm font-semibold">Price</th>
                  <th className="p-4 text-sm font-semibold">Stock</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                          <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/100/100`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{item.category}</td>
                    <td className="p-4">{item.brand || 'Others'}</td>
                    <td className="p-4">{formatPHP(item.daily_price)}</td>
                    <td className="p-4">{Math.max(0, item.stock || 0)}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        onClick={() => onToggleItemAvailability(item.id, !(item.is_available !== false))}
                        aria-label={`Toggle ${item.name} availability`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${item.is_available !== false ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">{item.is_available !== false}</p>
                    </td>
                    <td className="space-x-2 p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onOpenBlockModal(item)}>
                        Block Dates
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onOpenEditEditor(item)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteItem(item)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Rental Calendar</h1>
            <Button variant="outline" onClick={onRefreshCalendar}>
              Refresh
            </Button>
          </div>
          <div className="max-w-sm">
            <label className="mb-2 block text-sm font-medium">Select gear</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={selectedCalendarItemId} onChange={(event) => onChangeSelectedCalendarItemId(event.target.value)}>
              <option value="all">All gear</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {calendarLoading && <p className="text-sm text-muted-foreground">Loading availability...</p>}
          <div className="space-y-4">
            {calendarItems.map((item) => {
              const availability = availabilityByItem[item.id] || { bookings: [], manualBlocks: [] };
              const unavailable = [
                ...availability.bookings.map((booking) => ({
                  key: `booking-${booking.start_date}-${booking.end_date}-${booking.status}`,
                  start: booking.start_date,
                  end: booking.end_date,
                  status: booking.status,
                  label: `${booking.renter_name || 'Unknown renter'} • ${booking.status.replace(/_/g, ' ')}`,
                })),
                ...availability.manualBlocks.map((block) => ({
                  key: `block-${block.id}`,
                  start: block.start_date,
                  end: block.end_date,
                  status: 'BLOCKED',
                  label: `Manual block${block.reason ? `: ${block.reason}` : ''}`,
                })),
              ].sort((a, b) => a.start.localeCompare(b.start));

              const gearColor = itemColorMap.get(item.id) || '#0ea5e9';
              return (
                <Card key={item.id} className="p-5" style={{ borderColor: gearColor, borderWidth: 2 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold" style={{ color: gearColor }}>{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPHP(item.daily_price)}/day</span>
                  </div>
                  <PeriodCalendar
                    periods={unavailable.map((slot) => {
                      let tone: 'approved' | 'pending' | 'blocked' | 'active' | 'rejected' = 'pending';
                      if (slot.status === 'BLOCKED') tone = 'blocked';
                      else if (slot.status === 'ONGOING') tone = 'approved';
                      else if (slot.status === 'APPROVED') tone = 'approved';
                      else if (slot.status !== 'PENDING_REVIEW') tone = 'pending';
                      return {
                        id: slot.key,
                        start: slot.start,
                        end: slot.end,
                        label: `${item.name} • ${slot.label}`,
                        tone,
                      };
                    })}
                  />
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Rental Form Builder</h1>
              <p className="text-sm text-muted-foreground">Standard fields remain fixed. Add extra fields required by your store.</p>
              <div className='pt-5'>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
             More editable features will coom soon! Thank you for your patience
                </p>
                </div>
            </div>
          
            <div className="flex gap-2">
              <Button variant="outline" onClick={onAddCustomField}>
                Add Field
              </Button>
              <Button onClick={onSaveCustomForm}>Save Form</Button>
            </div>
          </div>
          <Card className="space-y-4 p-5">
            <div className="space-y-3 rounded-xl border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={rentalFormSettings.show_branch_map}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, show_branch_map: event.target.checked })}
                />
                Show branch map in rental agreement form
              </label>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Reference Text</label>
                <textarea
                  value={rentalFormSettings.reference_text}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, reference_text: event.target.value })}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Optional notes, instructions, reminders..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference Image (optional)</label>
                <Input type="file" accept="image/*" onChange={(event) => onReferenceImageFileChange(event.target.files?.[0] ?? null)} />
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={rentalFormSettings.reference_image_position}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, reference_image_position: event.target.value === 'mid' ? 'mid' : 'top' })}
                >
                  <option value="top">Show at top of rental form</option>
                  <option value="mid">Show in middle of rental form</option>
                </select>
                {(referenceImageFile || rentalFormSettings.reference_image_url) && (
                  <div className="h-28 w-40 overflow-hidden rounded-md border bg-muted/20">
                    <img src={referenceImageFile ? URL.createObjectURL(referenceImageFile) : rentalFormSettings.reference_image_url} alt="Reference" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            {rentalFormFields.length === 0 && <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">No custom fields yet.</p>}
            {rentalFormFields.map((field, index) => (
              <div key={`${field.id}-${index}`} className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-12">
                <Input className="md:col-span-3" placeholder="Field ID" value={field.id} onChange={(event) => onUpdateCustomField(index, { id: event.target.value })} />
                <Input className="md:col-span-4" placeholder="Label" value={field.label} onChange={(event) => onUpdateCustomField(index, { label: event.target.value })} />
                <select
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
                  value={field.type}
                  onChange={(event) => onUpdateCustomField(index, { type: event.target.value as RentalFormField['type'] })}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                </select>
                <Input className="md:col-span-2" placeholder="Placeholder" value={field.placeholder || ''} onChange={(event) => onUpdateCustomField(index, { placeholder: event.target.value })} />
                <div className="flex items-center gap-2 md:col-span-1">
                  <input type="checkbox" checked={field.required} onChange={(event) => onUpdateCustomField(index, { required: event.target.checked })} />
                  <span className="text-xs">Required</span>
                </div>
                {field.type === 'select' && (
                  <Input
                    className="md:col-span-10"
                    placeholder="Options (comma separated)"
                    value={(field.options || []).join(', ')}
                    onChange={(event) =>
                      onUpdateCustomField(index, {
                        options: event.target.value
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                )}
                <div className="md:col-span-2">
                  <Button variant="ghost" className="text-destructive" onClick={() => onRemoveCustomField(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Fraud List</h1>
            <Button variant="outline" onClick={onExportFraud}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Add internal/global fraud entries. Global requests need admin approval.</p>
          {fraudAccessError ? (
            <Card className="p-4">
              <p className="text-sm text-amber-900">{fraudAccessError}</p>
            </Card>
          ) : (
            <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <Input placeholder="Full name" value={fraudManual.full_name} onChange={(event) => onFraudManualChange({ ...fraudManual, full_name: event.target.value })} />
              <Input placeholder="Email" value={fraudManual.email} onChange={(event) => onFraudManualChange({ ...fraudManual, email: event.target.value })} />
              <Input placeholder="Contact number" value={fraudManual.contact_number} onChange={(event) => onFraudManualChange({ ...fraudManual, contact_number: event.target.value })} />
              <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => onFraudScopeChange(event.target.value === 'global' ? 'global' : 'internal')}>
                <option value="internal">Internal</option>
                <option value="global">Global (admin approval)</option>
              </select>
              <Input placeholder="Reason" value={fraudReason} onChange={(event) => onFraudReasonChange(event.target.value)} />
              <div className="md:col-span-2">
                <Input type="file" accept="image/*" onChange={(event) => onFraudEvidenceFileChange(event.target.files?.[0] ?? null)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={onSubmitManualFraud}>Add Fraud Person</Button>
              </div>
            </Card>
          )}
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Reported Person</th>
                  <th className="p-4 text-sm font-semibold">Contact Info</th>
                  <th className="p-4 text-sm font-semibold">Reason</th>
                  <th className="p-4 text-sm font-semibold">Scope</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {fraudEntries.map((entry) => (
                  <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{entry.full_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{entry.email}</p>
                      <p className="text-xs text-muted-foreground">{entry.contact_number}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{entry.reason}</p>
                      {entry.evidence_image_url ? (
                        <a href={entry.evidence_image_url} target="_blank" rel="noreferrer" className="text-xs underline">
                          View evidence
                        </a>
                      ) : null}
                    </td>
                    <td className="p-4">
                      {entry.scope === 'global' ? (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                          <Globe className="h-2 w-2" /> Global
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Internal</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{entry.status || 'approved'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Support & Feedback</h1>
            <p className="text-sm text-muted-foreground">Send feedback to superadmin and track replies.</p>
          </div>

          <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            <select
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={supportForm.type}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, type: event.target.value as SupportTicket['type'] }))}
            >
              <option value="feedback">Feedback</option>
              <option value="support">Support Request</option>
              <option value="bug">Bug Report</option>
            </select>
            <select
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={supportForm.priority}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, priority: event.target.value as SupportTicket['priority'] }))}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <Input className="md:col-span-2" placeholder="Subject" value={supportForm.subject} onChange={(event) => setSupportForm((prev) => ({ ...prev, subject: event.target.value }))} />
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:col-span-2"
              placeholder="Write your feedback/support message..."
              value={supportForm.message}
              onChange={(event) => setSupportForm((prev) => ({ ...prev, message: event.target.value }))}
            />
            <div className="md:col-span-2">
              <Button
                disabled={supportBusy}
                onClick={async () => {
                  if (!supportForm.subject.trim() || !supportForm.message.trim()) return alert('Subject and message are required');
                  try {
                    setSupportBusy(true);
                    if (editingSupportId) {
                      await onUpdateSupportTicket(editingSupportId, {
                        type: supportForm.type,
                        priority: supportForm.priority,
                        subject: supportForm.subject.trim(),
                        message: supportForm.message.trim(),
                      });
                    } else {
                      await onCreateSupportTicket({
                        type: supportForm.type,
                        priority: supportForm.priority,
                        subject: supportForm.subject.trim(),
                        message: supportForm.message.trim(),
                      });
                    }
                    setSupportForm({ type: 'feedback', priority: 'medium', subject: '', message: '' });
                    setEditingSupportId(null);
                  } finally {
                    setSupportBusy(false);
                  }
                }}
              >
                <Send className="mr-2 h-4 w-4" /> {editingSupportId ? 'Update Feedback' : 'Send Feedback'}
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {supportTickets.map((ticket) => (
              <Card key={ticket.id} className="space-y-3 p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <p className="inline-flex items-center gap-2 text-base font-semibold">
                      <MessageSquare className="h-4 w-4 text-slate-600" /> {ticket.subject}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Type: {ticket.type} • Priority: {ticket.priority}</p>
                    <p className="text-xs text-muted-foreground">Status: {ticket.status} • Updated: {format(parseISO(ticket.updated_at), 'MMM dd, yyyy hh:mm a')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSupportId(ticket.id);
                        setSupportForm({
                          type: ticket.type,
                          priority: ticket.priority,
                          subject: ticket.subject,
                          message: ticket.message,
                        });
                      }}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => void onDeleteSupportTicket(ticket.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap">{ticket.message}</div>
                {ticket.admin_reply ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">Admin Reply</p>
                    <p className="whitespace-pre-wrap text-slate-700">{ticket.admin_reply}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No admin reply yet.</p>
                )}
              </Card>
            ))}
            {!supportTickets.length && <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>}
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="max-h-[90vh] max-w-6xl overflow-auto rounded-xl bg-background p-3" onClick={(event) => event.stopPropagation()}>
            <img src={previewImageUrl} alt="Preview" className="h-auto max-h-[85vh] w-auto max-w-full object-contain" />
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewFile(null)}>
          <div className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white p-3 text-slate-900" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{previewFile.type}</p>
              <div className="flex items-center gap-2">
                <a href={previewFile.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border px-2 py-1 text-xs font-semibold">
                  <ExternalLink className="mr-1 h-3 w-3" /> Open
                </a>
                <button type="button" onClick={() => downloadFile(previewFile.sourceUrl, `${previewFile.type}.pdf`)} className="inline-flex items-center rounded border px-2 py-1 text-xs font-semibold" disabled={fileLoading}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </button>
              </div>
            </div>
            <iframe title={previewFile.type} src={previewFile.url} className="h-[82vh] w-full rounded border" />
            <p className="mt-2 text-xs text-muted-foreground">If preview fails, click Open.</p>
          </div>
        </div>
      )}

      {fileLoading && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900">Preparing file...</div>
        </div>
      )}
    </>
  );
}
