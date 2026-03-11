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
  const { addToCart, clearCart, user, token, setSession } = useAppStore();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    phone: user?.phone || '',
  });

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
              onChange={(files) => setProfileImageFile(files?.[0] || null)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Full Name</label>
              <Input disabled={!profileEditing} value={profileForm.full_name} onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Email</label>
              <Input disabled={!profileEditing} type="email" value={profileForm.email} onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <PhoneInput label="Contact Number" value={profileForm.phone} required disabled={!profileEditing} onChange={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))} />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                disabled={profileSaving || !profileEditing}
                onClick={async () => {
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
                      alert(phoneCheck.error);
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
                    alert('Profile updated');
                  } catch (error: any) {
                    alert(error?.message || 'Failed to update profile');
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-600 hover:text-red-700"
                      disabled={cancellingOrderId === order.id}
                      onClick={async () => {
                        const reason = prompt('Reason for cancellation:');
                        if (!reason || !reason.trim()) {
                          alert('Cancellation reason is required.');
                          return;
                        }
                        try {
                          setCancellingOrderId(order.id);
                          await api.post(`/api/account/orders/${order.id}/cancel`, { reason: reason.trim() });
                          await loadOrders();
                          alert('Order cancelled.');
                        } catch (error: any) {
                          alert(error?.message || 'Failed to cancel order.');
                        } finally {
                          setCancellingOrderId(null);
                        }
                      }}
                    >
                      <Ban className="mr-1 h-3 w-3" /> Cancel Order
                    </Button>
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Order Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                &times;
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm">#{selectedOrder.id}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{selectedOrder.status.replace(/_/g, ' ')}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Store / Branch</p>
                <p className="text-sm font-medium">{selectedOrder.store_name}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.store_branch_name || 'Main Branch'} • {selectedOrder.store_branch_address || '-'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Delivery / Payment</p>
                <p className="text-sm">{selectedOrder.delivery_mode || '-'} • {selectedOrder.payment_mode || '-'}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.delivery_address || '-'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                <p className="text-sm">{selectedOrder.renter_name || '-'}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.renter_email || '-'}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.renter_phone || '-'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Emergency Contact</p>
                <p className="text-sm">{selectedOrder.renter_emergency_contact_name || '-'} {selectedOrder.renter_emergency_contact ? `(${selectedOrder.renter_emergency_contact})` : ''}</p>
                <p className="text-xs text-muted-foreground">Present Address: {selectedOrder.renter_address || '-'}</p>
              </Card>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Rented Items</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {selectedOrder.items.map((item) => (
                  <Card key={`${selectedOrder.id}-${item.id}-${item.start_date}`} className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={item.image_url || `https://picsum.photos/seed/account-detail-${item.id}/120/120`} alt={item.name} className="h-12 w-12 rounded border object-cover" />
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.start_date} to {item.end_date}</p>
                        <p className="text-xs text-muted-foreground">Qty: {Math.max(1, item.quantity || 1)} • {formatPHP(item.daily_price)}/day</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Submitted Files</p>
                {(selectedOrder.documents || []).length ? (
                  <div className="space-y-1">
                    {(selectedOrder.documents || []).map((doc, index) => (
                      <a key={`${selectedOrder.id}-${doc.type}-${index}`} href={doc.url} target="_blank" rel="noreferrer" className="block text-sm underline">
                        {doc.type || `File ${index + 1}`}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No files attached.</p>
                )}
              </Card>
              <Card className="p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Amount Summary</p>
                <p className="text-sm">Total: <span className="font-semibold">{formatPHP(selectedOrder.total_amount)}</span></p>
                {selectedOrder.voucher_code ? <p className="text-xs text-muted-foreground">Voucher: {selectedOrder.voucher_code} (-{formatPHP(selectedOrder.voucher_discount || 0)})</p> : null}
                {selectedOrder.cancellation_reason ? <p className="mt-2 text-xs text-red-700">Cancellation reason: {selectedOrder.cancellation_reason}</p> : null}
                {selectedOrder.lease_agreement_submission_url ? (
                  <a href={selectedOrder.lease_agreement_submission_url} target="_blank" rel="noreferrer" className="mt-2 block text-xs underline">
                    View submitted lease agreement
                  </a>
                ) : null}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
