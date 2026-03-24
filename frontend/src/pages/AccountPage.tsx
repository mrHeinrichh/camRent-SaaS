import { useEffect, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { AlertCircle, Ban, CheckCircle2, FileDown, History, Package, RotateCcw, Clock, Pencil, User } from 'lucide-react';
import { PeriodCalendar } from '@/src/components/PeriodCalendar';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { OrderHistory } from '@/src/types/domain';
import { Button, Card, Input, cn } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';
import { PhoneInput } from '@/src/components/PhoneInput';
import { validatePhone } from '@/src/lib/phone';
import type { CalendarPeriodTone } from '@/src/components/PeriodCalendar';
import { EmptyState } from '@/src/components/EmptyState';

interface AccountPageProps {
  onNavigate: (page: AppPage) => void;
}

interface ProfileUpdateResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: 'renter' | 'owner' | 'admin';
    full_name: string;
    avatar_url: string;
    phone?: string;
  };
}

export function AccountPage({ onNavigate }: AccountPageProps) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistory | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('');
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({});
  const [cancelNotice, setCancelNotice] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);
  const { addToCart, clearCart, user, token, setSession } = useAppStore();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    phone: user?.phone || '',
  });

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess] = useState('');

  const clearProfileError = (field: string) => {
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      avatar_url: user?.avatar_url || '',
      phone: user?.phone || '',
    });
    setProfileEditing(false);
    setProfileImageFile(null);
  }, [user?.full_name, user?.email, user?.avatar_url, user?.phone]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImageFile]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get<OrderHistory[]>('/api/account/orders');
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleReorder = (order: OrderHistory) => {
    clearCart();
    order.items.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        daily_price: item.daily_price,
        deposit_amount: 0,
        image_url: item.image_url,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        store_id: order.store_id,
      });
    });
    onNavigate('cart');
  };

  if (loading) return <div className="p-12 text-center">Loading account...</div>;

  const stats = {
    total: orders.length,
    active: orders.filter((order) => order.status === 'APPROVED' || order.status === 'ONGOING').length,
    pending: orders.filter((order) => order.status === 'PENDING_REVIEW').length,
    completed: orders.filter((order) => order.status === 'COMPLETED').length,
    cancelled: orders.filter((order) => order.status === 'CANCELLED' || order.status === 'CANCELLED_BY_OWNER').length,
  };
  const calendarPeriods = orders.flatMap((order) =>
    order.items.map((item) => ({
      id: `${order.id}-${item.id}-${item.start_date}-${item.end_date}`,
      start: item.start_date,
      end: item.end_date,
      label: `${item.name} (${order.status.replace(/_/g, ' ')})`,
      tone:
        (order.status === 'PENDING_REVIEW'
          ? 'pending'
          : order.status === 'CANCELLED' || order.status === 'CANCELLED_BY_OWNER'
            ? 'blocked'
            : 'active') as CalendarPeriodTone,
    })),
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">Manage your rentals and order history.</p>
        </div>
      </div>

      <Card className="mb-8 space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Profile</h2>
          <Button
            type="button"
            variant={profileEditing ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setProfileEditing((prev) => !prev)}
          >
            <Pencil className="mr-2 h-3 w-3" /> {profileEditing ? 'Stop Editing' : 'Edit'}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[96px,1fr]">
          <div className="space-y-2">
            <img
              src={profileImagePreviewUrl || profileForm.avatar_url || 'https://placehold.co/96x96?text=User'}
              alt="Profile"
              className="h-24 w-24 rounded-full border object-cover"
              referrerPolicy="no-referrer"
            />
            <FileUpload
              label="Profile Image"
              accept="image/*"
              disabled={!profileEditing}
              file={profileImageFile}
              onChange={(files) => { setProfileImageFile(files?.[0] || null); clearProfileError('avatar_url'); }}
              error={profileErrors.avatar_url}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Input label="Full Name" disabled={!profileEditing} value={profileForm.full_name} onChange={(event) => { setProfileForm((prev) => ({ ...prev, full_name: event.target.value })); clearProfileError('full_name'); }} error={profileErrors.full_name} />
            </div>
            <div className="space-y-1">
              <Input label="Email" disabled={!profileEditing} type="email" value={profileForm.email} onChange={(event) => { setProfileForm((prev) => ({ ...prev, email: event.target.value })); clearProfileError('email'); }} error={profileErrors.email} />
            </div>
            <div className="md:col-span-2">
              <PhoneInput label="Contact Number" value={profileForm.phone} required disabled={!profileEditing} onChange={(value) => { setProfileForm((prev) => ({ ...prev, phone: value })); clearProfileError('phone'); }} error={profileErrors.phone} />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                className="w-full md:w-auto h-11 px-8 rounded-full font-bold shadow-sm"
                disabled={profileSaving || !profileEditing}
                onClick={async () => {
                  setProfileErrors({});
                  setProfileSuccess('');
                  try {
                    setProfileSaving(true);
                    let nextAvatarUrl = profileForm.avatar_url;
                    if (profileImageFile) {
                      const fd = new FormData();
                      fd.append('file', profileImageFile);
                      const upload = await api.post<{ url: string }>('/api/upload/public', fd);
                      nextAvatarUrl = upload.url;
                    }
                    const phoneCheck = validatePhone(profileForm.phone);
                    if (!phoneCheck.valid) {
                      setProfileErrors({ phone: phoneCheck.error || 'Invalid phone number' });
                      return;
                    }
                    const result = await api.put<ProfileUpdateResponse>('/api/auth/profile', {
                      full_name: profileForm.full_name,
                      email: profileForm.email,
                      avatar_url: nextAvatarUrl,
                      phone: profileForm.phone,
                    });
                    setProfileImageFile(null);
                    setProfileForm({
                      full_name: result.user.full_name || '',
                      email: result.user.email || '',
                      avatar_url: result.user.avatar_url || '',
                      phone: result.user.phone || '',
                    });
                    setSession(result.user, result.token || token);
                    setProfileEditing(false);
                    setProfileSuccess('Profile updated successfully!');
                  } catch (error: any) {
                    setProfileErrors({ submit: error?.message || 'Failed to update profile' });
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
              {profileSuccess && <p className="mt-3 text-center text-sm font-bold text-emerald-600 animate-fade-up">{profileSuccess}</p>}
              {profileErrors.submit && <p className="mt-3 text-center text-sm font-bold text-red-500 animate-fade-up">{profileErrors.submit}</p>}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Total Rentals', value: stats.total, icon: Package },
          { label: 'Active', value: stats.active, icon: Clock },
          { label: 'Pending', value: stats.pending, icon: AlertCircle },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Cancelled', value: stats.cancelled, icon: Ban },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <History className="h-5 w-5" /> Order History
      </h2>

      <Card className="mb-8 p-4">
        <h3 className="mb-3 text-lg font-bold">Rental Calendar (Period View)</h3>
        <PeriodCalendar periods={calendarPeriods} />
      </Card>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 p-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">#{order.id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Date</p>
                  <p className="text-sm">{format(parseISO(order.created_at), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Store</p>
                  <p className="text-sm font-medium">{order.store_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium">{order.store_branch_name || 'Main Branch'}</p>
                  <p className="text-xs text-muted-foreground">{order.store_branch_address || 'No branch address provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-bold uppercase',
                    order.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'PENDING_REVIEW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'CANCELLED_BY_OWNER'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-muted text-muted-foreground',
                  )}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                  View Details
                </Button>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                      <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/100/100`} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {item.start_date} to {item.end_date}
                      </p>
                      <p className="text-xs text-muted-foreground">Quantity: {Math.max(1, item.quantity || 1)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatPHP(item.daily_price)}</p>
                      <p className="text-[10px] text-muted-foreground">per day</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex gap-4">
                  {order.lease_agreement_submission_url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.open(order.lease_agreement_submission_url, '_blank', 'noopener,noreferrer')}
                    >
                      <FileDown className="mr-1 h-3 w-3" /> Submitted Lease
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" disabled>
                      <FileDown className="mr-1 h-3 w-3" /> No Lease File
                    </Button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleReorder(order)}>
                      <RotateCcw className="mr-1 h-3 w-3" /> Reorder
                    </Button>
                  )}
                  {order.status === 'PENDING_REVIEW' && (
                    <div className="flex flex-col gap-2">
                      {!cancelReason.hasOwnProperty(order.id) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700"
                          onClick={() => setCancelReason(prev => ({ ...prev, [order.id]: '' }))}
                        >
                          <Ban className="mr-1 h-3 w-3" /> Cancel Order
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Reason..."
                            className="h-8 text-xs min-w-[120px]"
                            value={cancelReason[order.id]}
                            onChange={(e) => setCancelReason(prev => ({ ...prev, [order.id]: e.target.value }))}
                          />
                          <Button 
                            size="sm" 
                            className="h-8 px-2 text-[10px]" 
                            disabled={cancellingOrderId === order.id}
                            onClick={async () => {
                              const reason = cancelReason[order.id];
                              if (!reason || !reason.trim()) {
                                setCancelNotice({ id: order.id, type: 'error', message: 'Reason required' });
                                return;
                              }
                              try {
                                setCancellingOrderId(order.id);
                                await api.post(`/api/account/orders/${order.id}/cancel`, { reason: reason.trim() });
                                await loadOrders();
                                setCancelNotice({ id: order.id, type: 'success', message: 'Order cancelled' });
                                setCancelReason(prev => {
                                  const next = { ...prev };
                                  delete next[order.id];
                                  return next;
                                });
                              } catch (error: any) {
                                setCancelNotice({ id: order.id, type: 'error', message: error?.message || 'Failed' });
                              } finally {
                                setCancellingOrderId(null);
                                setTimeout(() => setCancelNotice(null), 3000);
                              }
                            }}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-[10px]"
                            onClick={() => setCancelReason(prev => {
                              const next = { ...prev };
                              delete next[order.id];
                              return next;
                            })}
                          >
                            &times;
                          </Button>
                        </div>
                      )}
                      {cancelNotice?.id === order.id && (
                        <p className={cn(
                          "text-[10px] font-bold mt-1",
                          cancelNotice.type === 'success' ? "text-emerald-600" : "text-red-500"
                        )}>
                          {cancelNotice.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-bold">{formatPHP(order.total_amount)}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!orders.length ? (
          <EmptyState
            title="No Transactions Yet"
            message="Your account has no rental history as of the moment. Place your first rental and come back here."
          />
        ) : null}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6" onClick={() => setSelectedOrder(null)}>
          <div 
            className="i3d-modal max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-[var(--tone-surface)] p-6 sm:p-8 text-[var(--tone-text)] shadow-2xl border border-white/40 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--tone-accent)]/20 pb-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[var(--tone-text)]">Transaction Details</h3>
                <p className="mt-1 font-mono text-sm text-[var(--tone-text-muted)]">Order #{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider',
                    selectedOrder.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : selectedOrder.status === 'PENDING_REVIEW'
                        ? 'bg-yellow-100/80 text-yellow-700'
                        : selectedOrder.status === 'CANCELLED_BY_OWNER'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-muted text-muted-foreground',
                  )}
                >
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="rounded-full hover:bg-[var(--tone-accent)]/10 text-[var(--tone-text)]">
                  &times;
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="rounded-3xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-2">Facility & Fulfillment</p>
                <p className="text-base font-bold text-[var(--tone-text)]">{selectedOrder.store_name}</p>
                <p className="text-xs font-medium text-[var(--tone-text-muted)] mt-1">{selectedOrder.store_branch_name || 'Main Branch'}</p>
                <div className="mt-4 space-y-2 text-sm text-[var(--tone-text)]">
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <span className="text-[var(--tone-text-muted)]">Delivery</span>
                    <span className="font-semibold">{selectedOrder.delivery_mode || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[var(--tone-text-muted)]">Payment</span>
                    <span className="font-semibold">{selectedOrder.payment_mode || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-2">Customer Info</p>
                <p className="text-base font-bold text-[var(--tone-text)]">{selectedOrder.renter_name || '-'}</p>
                <p className="text-xs text-[var(--tone-text-muted)] mt-1">{selectedOrder.renter_email}</p>
                <p className="text-xs text-[var(--tone-text-muted)]">{selectedOrder.renter_phone}</p>
                <div className="mt-4 pt-3 border-t border-black/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-1">Present Address</p>
                  <p className="text-sm font-medium line-clamp-2">{selectedOrder.renter_address || '-'}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/40 p-5 shadow-sm backdrop-blur-sm lg:col-span-1 md:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-2">Emergency Contact</p>
                <p className="text-base font-bold text-[var(--tone-text)]">{selectedOrder.renter_emergency_contact_name || '-'}</p>
                <p className="text-sm font-medium text-[var(--tone-text-muted)] mt-1">{selectedOrder.renter_emergency_contact || '-'}</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                <Package className="h-4 w-4" /> Rented Equipment ({selectedOrder.items.length})
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {selectedOrder.items.map((item) => (
                  <div key={`${selectedOrder.id}-${item.id}-${item.start_date}`} className="group flex items-center gap-4 rounded-2xl border border-white/60 bg-white/40 p-3 shadow-sm transition-all hover:bg-white/60">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/50 bg-[var(--tone-bg)] shadow-inner">
                      <img src={item.image_url || `https://picsum.photos/seed/account-detail-${item.id}/120/120`} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--tone-text)]">{item.name}</p>
                      <p className="text-xs font-medium text-[var(--tone-text-muted)] mt-0.5">{item.start_date} → {item.end_date}</p>
                      <p className="text-xs font-semibold text-[var(--tone-accent)] mt-1">Qty: {Math.max(1, item.quantity || 1)}x</p>
                    </div>
                    <div className="text-right shrink-0 pr-2">
                      <p className="text-sm font-black text-[var(--tone-text)]">{formatPHP(item.daily_price)}</p>
                      <p className="text-[10px] font-semibold tracking-wider text-[var(--tone-text-muted)] uppercase">/ day</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-[var(--tone-accent)]/20 bg-white/20 p-5 backdrop-blur-md">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Attachments</h4>
                {(selectedOrder.documents || []).length || selectedOrder.lease_agreement_submission_url ? (
                  <div className="space-y-2">
                    {selectedOrder.lease_agreement_submission_url && (
                       <a href={selectedOrder.lease_agreement_submission_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-white/50 p-3 text-sm font-medium transition-colors hover:bg-white/80">
                         <span className="flex items-center gap-2 font-semibold">
                           <FileDown className="h-4 w-4 text-blue-600" /> Signed Agreement
                         </span>
                         <span className="text-xs text-[var(--tone-text-muted)]">View doc &rarr;</span>
                       </a>
                    )}
                    {(selectedOrder.documents || []).map((doc, index) => (
                      <a key={`${selectedOrder.id}-${doc.type}-${index}`} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-white/50 p-3 text-sm font-medium transition-colors hover:bg-white/80">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-slate-500" /> {doc.type || `Document ${index + 1}`}
                        </span>
                        <span className="text-xs text-[var(--tone-text-muted)]">View file &rarr;</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tone-accent)]/30 bg-[var(--tone-bg)]/50">
                    <p className="text-sm font-medium text-[var(--tone-text-muted)]">No attachments found</p>
                  </div>
                )}
              </div>
              
              <div className="rounded-3xl border border-[var(--tone-accent)] bg-[var(--tone-surface)] p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--tone-accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Final Accounting</h4>
                
                <div className="space-y-3 relative z-10">
                  {selectedOrder.voucher_code && (
                    <div className="flex items-center justify-between pb-3 border-b border-black/5">
                      <div>
                        <span className="text-sm font-semibold text-[var(--tone-text-muted)]">Voucher Applied</span>
                        <p className="text-xs font-bold uppercase text-green-600">{selectedOrder.voucher_code}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">-{formatPHP(selectedOrder.voucher_discount || 0)}</span>
                    </div>
                  )}
                  {selectedOrder.cancellation_reason && (
                    <div className="rounded-xl bg-red-50/80 p-3 border border-red-100">
                      <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Cancellation Reason</p>
                      <p className="text-sm font-medium text-red-800">{selectedOrder.cancellation_reason}</p>
                    </div>
                  )}
                  <div className="flex items-end justify-between pt-2">
                    <span className="text-base font-bold text-[var(--tone-text)]">Total Paid</span>
                    <span className="text-3xl font-black tracking-tight text-[var(--tone-text)]">{formatPHP(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
