import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Ban, Calendar as CalendarIcon, Camera, ChevronRight, Clock, Download, Globe, LayoutDashboard, ReceiptText, ShieldAlert, User, Users } from 'lucide-react';
import { api } from '@/src/lib/api';
import { PeriodCalendar } from '@/src/components/PeriodCalendar';
import type { Booking, FraudListEntry, Item, ManualBlock, OwnerApplication, OwnerDashboardData, RentalFormField, RentalFormSchemaResponse } from '@/src/types/domain';
import { formatPHP } from '@/src/lib/currency';
import { exportRowsToCsv } from '@/src/lib/export';
import { Button, Card, Input, cn } from '@/src/components/ui';

type OwnerTab = 'overview' | 'applications' | 'inventory' | 'calendar' | 'customers' | 'transactions' | 'form' | 'fraud';

type ItemEditor = {
  id?: string;
  name: string;
  description: string;
  category: string;
  daily_price: string;
  stock: string;
  is_available: boolean;
  image_url: string;
};

interface UploadResponse {
  url: string;
}

const emptyEditor: ItemEditor = {
  name: '',
  description: '',
  category: '',
  daily_price: '',
  stock: '1',
  is_available: true,
  image_url: '',
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editor, setEditor] = useState<ItemEditor>(emptyEditor);
  const [editorImageFile, setEditorImageFile] = useState<File | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedCalendarItemId, setSelectedCalendarItemId] = useState<string>('all');
  const [availabilityByItem, setAvailabilityByItem] = useState<Record<string, { bookings: Booking[]; manualBlocks: ManualBlock[] }>>({});
  const [rentalFormFields, setRentalFormFields] = useState<RentalFormField[]>([]);
  const [rentalFormSettings, setRentalFormSettings] = useState<{
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  }>({
    show_branch_map: true,
    reference_text: '',
    reference_image_url: '',
    reference_image_position: 'top',
  });
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [fraudEntries, setFraudEntries] = useState<FraudListEntry[]>([]);
  const [fraudAccessError, setFraudAccessError] = useState<string | null>(null);
  const [blockModalItem, setBlockModalItem] = useState<Item | null>(null);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [reportCustomer, setReportCustomer] = useState<{
    renter_name: string;
    renter_email: string;
    renter_phone: string;
  } | null>(null);
  const [fraudScope, setFraudScope] = useState<'internal' | 'global'>('internal');
  const [fraudReason, setFraudReason] = useState('');
  const [fraudEvidenceFile, setFraudEvidenceFile] = useState<File | null>(null);
  const [fraudManual, setFraudManual] = useState({
    full_name: '',
    email: '',
    contact_number: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, apps, items] = await Promise.all([
        api.get<OwnerDashboardData>('/api/dashboard/owner'),
        api.get<OwnerApplication[]>('/api/owner/applications'),
        api.get<Item[]>('/api/items'),
      ]);
      try {
        const fraud = await api.get<FraudListEntry[]>('/api/owner/fraud-list');
        setFraudEntries(fraud);
        setFraudAccessError(null);
      } catch {
        setFraudEntries([]);
        setFraudAccessError('Pending stores cannot access. Your account must be approved before you can see this.');
      }
      try {
        const schema = await api.get<RentalFormSchemaResponse>('/api/owner/rental-form');
        setRentalFormFields(schema.fields || []);
        setRentalFormSettings({
          show_branch_map: schema.settings?.show_branch_map !== false,
          reference_text: schema.settings?.reference_text || '',
          reference_image_url: schema.settings?.reference_image_url || '',
          reference_image_position: schema.settings?.reference_image_position === 'mid' ? 'mid' : 'top',
        });
      } catch {
        setRentalFormFields([]);
        setRentalFormSettings({
          show_branch_map: true,
          reference_text: '',
          reference_image_url: '',
          reference_image_position: 'top',
        });
      }
      setData(stats);
      setApplications(apps);
      setInventory(items);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCalendarData = async () => {
    if (!inventory.length) {
      setAvailabilityByItem({});
      return;
    }

    setCalendarLoading(true);
    try {
      const entries = await Promise.all(
        inventory.map(async (item) => {
          try {
            const detail = await api.get<Item>(`/api/items/${item.id}`);
            return [item.id, { bookings: detail.bookings || [], manualBlocks: detail.manualBlocks || [] }] as const;
          } catch {
            return [item.id, { bookings: [], manualBlocks: [] }] as const;
          }
        }),
      );
      setAvailabilityByItem(Object.fromEntries(entries));
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'calendar') {
      void loadCalendarData();
    }
  }, [activeTab, inventory]);

  const withReload = async (task: () => Promise<void>, successMessage: string) => {
    try {
      await task();
      alert(successMessage);
      await loadData();
      setSelectedApp(null);
      if (activeTab === 'calendar') await loadCalendarData();
    } catch (taskError: any) {
      alert(taskError.message);
    }
  };

  const handleApprove = (id: string) => withReload(() => api.post(`/api/orders/${id}/approve`), 'Application approved');
  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/reject`, { reason }), 'Application rejected');
  };
  const handleReportFraud = async (id: string) => {
    const reason = prompt('Why are you reporting this as fraud?');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/report-fraud`, { reason }), 'Reported as fraud');
  };
  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Reason for cancellation?');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/cancel`, { reason }), 'Booking cancelled');
  };

  const categories = useMemo(() => ['all', ...new Set(inventory.map((item) => item.category).filter(Boolean))], [inventory]);
  const filteredInventory = useMemo(
    () => (categoryFilter === 'all' ? inventory : inventory.filter((item) => item.category === categoryFilter)),
    [categoryFilter, inventory],
  );

  const openCreateEditor = () => {
    setEditor(emptyEditor);
    setEditorImageFile(null);
    setEditingOpen(true);
  };

  const openEditEditor = (item: Item) => {
    setEditor({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      daily_price: String(item.daily_price),
      stock: String(Math.max(0, item.stock || 0)),
      is_available: item.is_available !== false,
      image_url: item.image_url,
    });
    setEditorImageFile(null);
    setEditingOpen(true);
  };

  const saveItem = async () => {
    if (!data?.store?.id) return alert('Store not found');
    if (!editor.name.trim() || !editor.category.trim() || !editor.daily_price.trim()) {
      return alert('Name, category, and daily price are required');
    }

    const payload: Record<string, unknown> = {
      store_id: data.store.id,
      name: editor.name.trim(),
      description: editor.description.trim(),
      category: editor.category.trim(),
      daily_price: Number(editor.daily_price),
      stock: Math.max(0, Math.floor(Number(editor.stock))),
      is_available: editor.is_available,
      image_url: editor.image_url.trim(),
    };

    if (!Number.isFinite(payload.daily_price as number) || !Number.isFinite(payload.stock as number)) {
      return alert('Daily price and stock must be valid numbers');
    }

    setEditorSaving(true);
    try {
      if (editorImageFile) {
        const formData = new FormData();
        formData.append('file', editorImageFile);
        const uploadResult = await api.post<UploadResponse>('/api/upload', formData);
        payload.image_url = uploadResult.url;
      }

      if (editor.id) {
        await withReload(() => api.put(`/api/items/${editor.id}`, payload), 'Item updated');
      } else {
        await withReload(() => api.post('/api/items', payload), 'Item created');
      }
      setEditingOpen(false);
      setEditorImageFile(null);
    } finally {
      setEditorSaving(false);
    }
  };

  const deleteItem = async (item: Item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await withReload(() => api.delete(`/api/items/${item.id}`), 'Item deleted');
  };

  const addCustomFormField = () => {
    const nextIndex = rentalFormFields.length + 1;
    setRentalFormFields((prev) => [
      ...prev,
      { id: `custom_field_${nextIndex}`, label: `Custom Field ${nextIndex}`, type: 'text', required: false },
    ]);
  };

  const updateCustomFormField = (index: number, patch: Partial<RentalFormField>) => {
    setRentalFormFields((prev) => prev.map((field, current) => (current === index ? { ...field, ...patch } : field)));
  };

  const removeCustomFormField = (index: number) => {
    setRentalFormFields((prev) => prev.filter((_, current) => current !== index));
  };

  const saveCustomForm = async () => {
    let referenceImageUrl = rentalFormSettings.reference_image_url;
    if (referenceImageFile) {
      const formData = new FormData();
      formData.append('file', referenceImageFile);
      const uploadResult = await api.post<UploadResponse>('/api/upload/public', formData);
      referenceImageUrl = uploadResult.url;
      setRentalFormSettings((prev) => ({ ...prev, reference_image_url: referenceImageUrl }));
    }
    await withReload(
      () =>
        api.put('/api/owner/rental-form', {
          fields: rentalFormFields,
          settings: {
            show_branch_map: rentalFormSettings.show_branch_map,
            reference_text: rentalFormSettings.reference_text,
            reference_image_url: referenceImageUrl,
            reference_image_position: rentalFormSettings.reference_image_position,
          },
        }),
      'Rental form updated',
    );
    setReferenceImageFile(null);
  };

  const exportOverviewExcel = () => {
    exportRowsToCsv(
      'overview_report.csv',
      ['Metric', 'Value'],
      [
        ['Store', data.store?.name || ''],
        ['Total Rentals', data.stats?.total_rentals || 0],
        ['Total Revenue', data.stats?.total_revenue || 0],
        ['Total Customers', data.ownerAnalytics?.totalCustomers || 0],
        ['Total Successful Rentals', data.ownerAnalytics?.totalCustomersRented || 0],
        ['Total Profit', data.ownerAnalytics?.totalProfit || 0],
        ['Pending', data.ownerAnalytics?.pendingCount || 0],
        ['Reserved', data.ownerAnalytics?.reservedCount || 0],
      ],
    );
  };

  const exportInventoryExcel = () => {
    exportRowsToCsv(
      'inventory_report.csv',
      ['Name', 'Category', 'Daily Price', 'Stock', 'Available'],
      inventory.map((item) => [item.name, item.category, item.daily_price, Math.max(0, item.stock || 0), item.is_available !== false ? 'Yes' : 'No']),
    );
  };

  const exportCustomersExcel = () => {
    exportRowsToCsv(
      'customers_report.csv',
      ['Name', 'Email', 'Phone', 'Transactions', 'ID Types', 'Mostly Rented'],
      (data.customers || []).map((entry) => [
        entry.renter_name,
        entry.renter_email,
        entry.renter_phone,
        entry.transaction_count,
        entry.id_types.join(', '),
        entry.mostly_rented_gears.map((gear) => `${gear.name} (${gear.count})`).join(', '),
      ]),
    );
  };

  const exportTransactionsExcel = () => {
    exportRowsToCsv(
      'transactions_report.csv',
      ['Customer', 'Email', 'Amount', 'Status', 'ID Types', 'Created'],
      (data.recentTransactions || []).map((entry) => [
        entry.renter_name,
        entry.renter_email,
        entry.total_amount,
        entry.status,
        entry.id_types.join(', '),
        entry.created_at,
      ]),
    );
  };

  const exportFraudExcel = () => {
    exportRowsToCsv(
      'fraud_report.csv',
      ['Name', 'Email', 'Phone', 'Scope', 'Status', 'Reason'],
      fraudEntries.map((entry) => [entry.full_name, entry.email, entry.contact_number, entry.scope || '', entry.status || '', entry.reason]),
    );
  };

  const submitBlockDates = async () => {
    if (!blockModalItem || !blockStartDate || !blockEndDate) return;
    await withReload(
      () =>
        api.post('/api/manual-blocks', {
          item_id: blockModalItem.id,
          start_date: blockStartDate,
          end_date: blockEndDate,
          reason: blockReason,
        }),
      'Dates blocked',
    );
    setBlockModalItem(null);
    setBlockStartDate('');
    setBlockEndDate('');
    setBlockReason('');
  };

  const submitCustomerFraud = async () => {
    if (!reportCustomer) return;
    if (fraudScope === 'internal' && !fraudReason.trim()) return alert('Reason is required for internal fraud flagging');
    if (fraudScope === 'global' && !fraudReason.trim() && !fraudEvidenceFile) return alert('For global scope, add a reason or attach evidence image');
    let evidenceUrl = '';
    if (fraudEvidenceFile) {
      const formData = new FormData();
      formData.append('file', fraudEvidenceFile);
      const uploadResult = await api.post<UploadResponse>('/api/upload/public', formData);
      evidenceUrl = uploadResult.url;
    }
    await withReload(
      () =>
        api.post('/api/owner/customers/report-fraud', {
          full_name: reportCustomer.renter_name,
          email: reportCustomer.renter_email,
          contact_number: reportCustomer.renter_phone,
          reason: fraudReason,
          scope: fraudScope,
          evidence_image_url: evidenceUrl,
        }),
      fraudScope === 'global' ? 'Global fraud request submitted for admin approval' : 'Customer flagged in internal fraud list',
    );
    setReportCustomer(null);
    setFraudScope('internal');
    setFraudReason('');
    setFraudEvidenceFile(null);
  };

  const submitManualFraud = async () => {
    if (!fraudManual.full_name.trim() || !fraudManual.email.trim()) return alert('Name and email are required');
    if (fraudScope === 'internal' && !fraudReason.trim()) return alert('Reason is required for internal fraud flagging');
    if (fraudScope === 'global' && !fraudReason.trim() && !fraudEvidenceFile) return alert('For global scope, add a reason or attach evidence image');
    let evidenceUrl = '';
    if (fraudEvidenceFile) {
      const formData = new FormData();
      formData.append('file', fraudEvidenceFile);
      const uploadResult = await api.post<UploadResponse>('/api/upload/public', formData);
      evidenceUrl = uploadResult.url;
    }
    await withReload(
      () =>
        api.post('/api/owner/customers/report-fraud', {
          ...fraudManual,
          reason: fraudReason,
          scope: fraudScope,
          evidence_image_url: evidenceUrl,
        }),
      fraudScope === 'global' ? 'Global fraud request submitted for admin approval' : 'Fraud entry added',
    );
    setFraudManual({ full_name: '', email: '', contact_number: '' });
    setFraudReason('');
    setFraudScope('internal');
    setFraudEvidenceFile(null);
  };

  const calendarItems = useMemo(
    () => (selectedCalendarItemId === 'all' ? inventory : inventory.filter((item) => item.id === selectedCalendarItemId)),
    [inventory, selectedCalendarItemId],
  );
  const pieSlices = useMemo(() => {
    const pending = data?.ownerAnalytics?.pendingCount || 0;
    const reserved = data?.ownerAnalytics?.reservedCount || 0;
    const successful = data?.ownerAnalytics?.totalCustomersRented || 0;
    const completed = Math.max(0, successful - reserved);
    const values = [
      { label: 'Pending', value: pending, color: '#f59e0b' },
      { label: 'Reserved', value: reserved, color: '#3b82f6' },
      { label: 'Completed', value: completed, color: '#10b981' },
    ].filter((entry) => entry.value > 0);
    const total = values.reduce((sum, entry) => sum + entry.value, 0);
    let cursor = -Math.PI / 2;
    return values.map((entry) => {
      const sliceAngle = total > 0 ? (entry.value / total) * Math.PI * 2 : 0;
      const startAngle = cursor;
      const endAngle = cursor + sliceAngle;
      cursor = endAngle;
      return { ...entry, path: arcPath(100, 100, 80, startAngle, endAngle) };
    });
  }, [data]);
  const displayApprovedDate = useMemo(() => {
    if (data?.store?.approved_at) return data.store.approved_at;
    if (data?.store?.status === 'approved' && data.store.payment_due_date) {
      const due = new Date(data.store.payment_due_date);
      if (!Number.isNaN(due.getTime())) {
        due.setMonth(due.getMonth() - 1);
        return due.toISOString();
      }
    }
    return null;
  }, [data]);

  if (loading) return <div className="p-12 text-center">Loading dashboard...</div>;
  if (error) {
    return (
      <div className="space-y-4 p-12 text-center">
        <h1 className="text-2xl font-bold">Owner dashboard unavailable</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }
  if (!data || (data as any).error) {
    return (
      <div className="space-y-4 p-12 text-center">
        <h1 className="text-2xl font-bold">No store found</h1>
        <p className="text-muted-foreground">This owner account has no store record yet.</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 space-y-2 border-r bg-muted/20 p-6">
        <Button variant={activeTab === 'overview' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('overview')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
        </Button>
        <Button variant={activeTab === 'applications' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('applications')}>
          <Clock className="mr-2 h-4 w-4" /> Rental Applications
        </Button>
        <Button variant={activeTab === 'inventory' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('inventory')}>
          <Camera className="mr-2 h-4 w-4" /> Inventory
        </Button>
        <Button variant={activeTab === 'calendar' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('calendar')}>
          <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
        </Button>
        <Button variant={activeTab === 'customers' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('customers')}>
          <Users className="mr-2 h-4 w-4" /> Customers
        </Button>
        <Button variant={activeTab === 'transactions' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('transactions')}>
          <ReceiptText className="mr-2 h-4 w-4" /> Transactions
        </Button>
        <Button variant={activeTab === 'form' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('form')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Form Builder
        </Button>
        <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('fraud')}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Fraud List
        </Button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Store Overview</h1>
              <Button variant="outline" onClick={exportOverviewExcel}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </div>
            <Card className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Registered Store</p>
                  <h2 className="text-2xl font-bold">{data.store?.name || 'Unnamed Store'}</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">{data.store?.description || 'No store description yet.'}</p>
                  <p className="text-sm text-muted-foreground">{data.store?.address || 'No store address yet.'}</p>
                  {displayApprovedDate ? <p className="text-sm text-muted-foreground">Approved Date: {format(parseISO(displayApprovedDate), 'MMM dd, yyyy')}</p> : null}
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
                      We are still currently working on automations of payment, However manual payment via Gcash or Bank will work as of the moment,
                      Please message the owner of this website have your account approved or email him at mrheinrichhh@gmail.com or contact him at his
                      number 09569749935 with your payment and your store details, thank you for your patience.
                    </p>
                    
                  ) : null}
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold uppercase',
                    data.store?.status === 'approved' ? 'bg-green-100 text-green-700' : data.store?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
                  )}
                >
                  {data.store?.status || 'unknown'}
                </span>
              </div>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 text-lg font-bold">Status Distribution (Pie)</h3>
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <svg viewBox="0 0 200 200" className="h-52 w-52">
                    {pieSlices.length ? (
                      pieSlices.map((slice) => <path key={slice.label} d={slice.path} fill={slice.color} />)
                    ) : (
                      <circle cx="100" cy="100" r="80" fill="#e5e7eb" />
                    )}
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
                          style={{
                            width: `${Math.min(100, (entry.count / Math.max(1, (data.ownerAnalytics?.peakRentalDates || [])[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!(data.ownerAnalytics?.peakRentalDates || []).length && <p className="text-sm text-muted-foreground">No peak date data yet.</p>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Customers</h1>
              <Button variant="outline" onClick={exportCustomersExcel}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Customer</th>
                    <th className="p-4 text-sm font-semibold">Transactions</th>
                    <th className="p-4 text-sm font-semibold">ID Types</th>
                    <th className="p-4 text-sm font-semibold">Mostly Rented</th>
                    <th className="p-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.customers || []).map((customer) => (
                    <tr key={customer.renter_email} className="border-t align-top">
                      <td className="p-4 text-sm">
                        <p className="font-semibold">{customer.renter_name}</p>
                        <p className="text-muted-foreground">{customer.renter_email}</p>
                        <p className="text-muted-foreground">{customer.renter_phone}</p>
                      </td>
                      <td className="p-4 text-sm">{customer.transaction_count}</td>
                      <td className="p-4 text-sm">{customer.id_types.length ? customer.id_types.join(', ') : 'No IDs submitted'}</td>
                      <td className="p-4 text-sm">
                        {customer.mostly_rented_gears.length
                          ? customer.mostly_rented_gears.map((gear) => `${gear.name} (${gear.count})`).join(', ')
                          : 'No rentals yet'}
                      </td>
                      <td className="p-4 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.store?.status !== 'approved'}
                          onClick={() =>
                            setReportCustomer({
                              renter_name: customer.renter_name,
                              renter_email: customer.renter_email,
                              renter_phone: customer.renter_phone,
                            })
                          }
                        >
                          Flag as Fraud
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(data.customers || []).length && <p className="p-4 text-sm text-muted-foreground">No customers yet.</p>}
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Recent Transactions</h1>
              <Button variant="outline" onClick={exportTransactionsExcel}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Customer</th>
                    <th className="p-4 text-sm font-semibold">Amount</th>
                    <th className="p-4 text-sm font-semibold">Status</th>
                    <th className="p-4 text-sm font-semibold">ID Types</th>
                    <th className="p-4 text-sm font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentTransactions || []).map((transaction) => (
                    <tr key={transaction.id} className="border-t">
                      <td className="p-4 text-sm">
                        <p className="font-semibold">{transaction.renter_name}</p>
                        <p className="text-muted-foreground">{transaction.renter_email}</p>
                      </td>
                      <td className="p-4 text-sm">{formatPHP(transaction.total_amount)}</td>
                      <td className="p-4 text-sm">{transaction.status.replace(/_/g, ' ')}</td>
                      <td className="p-4 text-sm">{transaction.id_types.length ? transaction.id_types.join(', ') : 'No IDs submitted'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{format(parseISO(transaction.created_at), 'MMM dd, yyyy HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(data.recentTransactions || []).length && <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>}
            </Card>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Rental Applications</h1>
            <div className="grid grid-cols-1 gap-4">
              {applications.map((application) => (
                <Card key={application.id} className="flex cursor-pointer items-center justify-between p-6 transition-colors hover:bg-muted/10" onClick={() => setSelectedApp(application)}>
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
                      <p className="text-sm text-muted-foreground">
                        {application.items.length} items • {formatPHP(application.total_amount)}
                      </p>
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
                <Button variant="outline" onClick={exportInventoryExcel}>
                  <Download className="mr-2 h-4 w-4" /> Export Excel
                </Button>
                <Button onClick={openCreateEditor} className="h-10 rounded-full px-5">
                  Add New Gear
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button key={category} size="sm" variant={categoryFilter === category ? 'secondary' : 'outline'} onClick={() => setCategoryFilter(category)}>
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
                      <td className="p-4">{formatPHP(item.daily_price)}</td>
                      <td className="p-4">{Math.max(0, item.stock || 0)}</td>
                      <td className="p-4">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={item.is_available !== false}
                            onChange={(event) =>
                              void withReload(
                                () => api.put(`/api/items/${item.id}`, { is_available: event.target.checked }),
                                `Item marked as ${event.target.checked ? 'available' : 'unavailable'}`,
                              )
                            }
                          />
                          {item.is_available !== false ? 'Available' : 'Unavailable'}
                        </label>
                      </td>
                      <td className="space-x-2 p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBlockModalItem(item)}
                        >
                          Block Dates
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditEditor(item)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteItem(item)}>
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
              <Button variant="outline" onClick={loadCalendarData}>
                Refresh
              </Button>
            </div>

            <div className="max-w-sm">
              <label className="mb-2 block text-sm font-medium">Select gear</label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={selectedCalendarItemId}
                onChange={(event) => setSelectedCalendarItemId(event.target.value)}
              >
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
                    label: booking.status === 'ONGOING' ? 'Occupied' : 'Approved booking',
                  })),
                  ...availability.manualBlocks.map((block) => ({
                    key: `block-${block.id}`,
                    start: block.start_date,
                    end: block.end_date,
                    label: `Manual block${block.reason ? `: ${block.reason}` : ''}`,
                  })),
                ].sort((a, b) => a.start.localeCompare(b.start));

                return (
                  <Card key={item.id} className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatPHP(item.daily_price)}/day</span>
                    </div>
                    <PeriodCalendar
                      periods={unavailable.map((slot) => ({
                        id: slot.key,
                        start: slot.start,
                        end: slot.end,
                        label: slot.label,
                        tone: slot.label.startsWith('Manual block') ? 'blocked' : slot.label === 'Occupied' ? 'approved' : 'pending',
                      }))}
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
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addCustomFormField}>
                  Add Field
                </Button>
                <Button onClick={saveCustomForm}>Save Form</Button>
              </div>
            </div>

            <Card className="space-y-4 p-5">
              <div className="space-y-3 rounded-xl border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={rentalFormSettings.show_branch_map}
                    onChange={(event) => setRentalFormSettings((prev) => ({ ...prev, show_branch_map: event.target.checked }))}
                  />
                  Show branch map in rental agreement form
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Reference Text</label>
                  <textarea
                    value={rentalFormSettings.reference_text}
                    onChange={(event) => setRentalFormSettings((prev) => ({ ...prev, reference_text: event.target.value }))}
                    className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Optional notes, instructions, reminders..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reference Image (optional)</label>
                  <Input type="file" accept="image/*" onChange={(event) => setReferenceImageFile(event.target.files?.[0] ?? null)} />
                  <select
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={rentalFormSettings.reference_image_position}
                    onChange={(event) =>
                      setRentalFormSettings((prev) => ({ ...prev, reference_image_position: event.target.value === 'mid' ? 'mid' : 'top' }))
                    }
                  >
                    <option value="top">Show at top of rental form</option>
                    <option value="mid">Show in middle of rental form</option>
                  </select>
                  {(referenceImageFile || rentalFormSettings.reference_image_url) && (
                    <div className="h-28 w-40 overflow-hidden rounded-md border bg-muted/20">
                      <img
                        src={referenceImageFile ? URL.createObjectURL(referenceImageFile) : rentalFormSettings.reference_image_url}
                        alt="Reference"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              {rentalFormFields.length === 0 && <p className="text-sm text-muted-foreground">No custom fields yet.</p>}
              {rentalFormFields.map((field, index) => (
                <div key={`${field.id}-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-12">
                  <Input className="md:col-span-3" placeholder="Field ID" value={field.id} onChange={(event) => updateCustomFormField(index, { id: event.target.value })} />
                  <Input className="md:col-span-4" placeholder="Label" value={field.label} onChange={(event) => updateCustomFormField(index, { label: event.target.value })} />
                  <select
                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
                    value={field.type}
                    onChange={(event) => updateCustomFormField(index, { type: event.target.value as RentalFormField['type'] })}
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                  </select>
                  <Input className="md:col-span-2" placeholder="Placeholder" value={field.placeholder || ''} onChange={(event) => updateCustomFormField(index, { placeholder: event.target.value })} />
                  <div className="flex items-center gap-2 md:col-span-1">
                    <input type="checkbox" checked={field.required} onChange={(event) => updateCustomFormField(index, { required: event.target.checked })} />
                    <span className="text-xs">Required</span>
                  </div>
                  {field.type === 'select' && (
                    <Input
                      className="md:col-span-10"
                      placeholder="Options (comma separated)"
                      value={(field.options || []).join(', ')}
                      onChange={(event) =>
                        updateCustomFormField(index, {
                          options: event.target.value
                            .split(',')
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  )}
                  <div className="md:col-span-2">
                    <Button variant="ghost" className="text-destructive" onClick={() => removeCustomFormField(index)}>
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
              <Button variant="outline" onClick={exportFraudExcel}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </div>
            <p className="text-muted-foreground">Add internal/global fraud entries. Global requests need admin approval.</p>
            {fraudAccessError ? (
              <Card className="p-4">
                <p className="text-sm text-amber-900">{fraudAccessError}</p>
              </Card>
            ) : (
              <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <Input placeholder="Full name" value={fraudManual.full_name} onChange={(event) => setFraudManual((prev) => ({ ...prev, full_name: event.target.value }))} />
              <Input placeholder="Email" value={fraudManual.email} onChange={(event) => setFraudManual((prev) => ({ ...prev, email: event.target.value }))} />
              <Input placeholder="Contact number" value={fraudManual.contact_number} onChange={(event) => setFraudManual((prev) => ({ ...prev, contact_number: event.target.value }))} />
              <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => setFraudScope(event.target.value === 'global' ? 'global' : 'internal')}>
                <option value="internal">Internal</option>
                <option value="global">Global (admin approval)</option>
              </select>
              <Input placeholder="Reason" value={fraudReason} onChange={(event) => setFraudReason(event.target.value)} />
              <div className="md:col-span-2">
                <Input type="file" accept="image/*" onChange={(event) => setFraudEvidenceFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={submitManualFraud}>Add Fraud Person</Button>
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

        <AnimatePresence>
          {editingOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 8 }}
                className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
              >
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
                  <h2 className="text-2xl font-bold">{editor.id ? 'Edit Gear' : 'Add New Gear'}</h2>
                  <p className="mt-1 text-sm text-slate-200">Create clean, complete inventory details for renters.</p>
                </div>
                <div className="mb-4 flex items-center justify-between px-6 pt-4">
                  <Button variant="ghost" size="icon" onClick={() => setEditingOpen(false)}>
                    &times;
                  </Button>
                </div>
                <div className="space-y-4 px-6 pb-6">
                  <Input
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
                    placeholder="Gear name"
                    value={editor.name}
                    onChange={(event) => setEditor((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <Input
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
                    placeholder="Category (Camera, Lens, Audio, etc.)"
                    value={editor.category}
                    onChange={(event) => setEditor((prev) => ({ ...prev, category: event.target.value }))}
                  />
                  <Input
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
                    placeholder="Daily price"
                    type="number"
                    value={editor.daily_price}
                    onChange={(event) => setEditor((prev) => ({ ...prev, daily_price: event.target.value }))}
                  />
                  <Input
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
                    placeholder="Stock"
                    type="number"
                    min="0"
                    value={editor.stock}
                    onChange={(event) => setEditor((prev) => ({ ...prev, stock: event.target.value }))}
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                    <input type="checkbox" checked={editor.is_available} onChange={(event) => setEditor((prev) => ({ ...prev, is_available: event.target.checked }))} />
                    Available for renting
                  </label>
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Gear Photo</p>
                    <Input className="border-slate-200 bg-white text-slate-900 file:text-slate-700" type="file" accept="image/*" onChange={(event) => setEditorImageFile(event.target.files?.[0] ?? null)} />
                    <p className="text-xs text-slate-500">Upload a new photo. If empty, existing image is kept.</p>
                    {(editorImageFile || editor.image_url) && (
                      <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <img src={editorImageFile ? URL.createObjectURL(editorImageFile) : editor.image_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <textarea
                    placeholder="Description"
                    value={editor.description}
                    onChange={(event) => setEditor((prev) => ({ ...prev, description: event.target.value }))}
                    className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                  />
                </div>
                <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                  <Button variant="outline" onClick={() => setEditingOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800" onClick={saveItem} disabled={editorSaving}>
                    {editorSaving ? 'Saving...' : editor.id ? 'Save Changes' : 'Create Item'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {blockModalItem && (
            <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl">
                <h3 className="mb-3 text-lg font-bold">Block Dates - {blockModalItem.name}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Start Date</label>
                    <Input type="date" value={blockStartDate} onChange={(event) => setBlockStartDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Date</label>
                    <Input type="date" value={blockEndDate} onChange={(event) => setBlockEndDate(event.target.value)} min={blockStartDate || undefined} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
                    <Input value={blockReason} onChange={(event) => setBlockReason(event.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBlockModalItem(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitBlockDates}>Block Dates</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reportCustomer && (
            <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-xl bg-background p-5 shadow-xl">
                <h3 className="mb-1 text-lg font-bold">Flag Customer as Fraud</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {reportCustomer.renter_name} ({reportCustomer.renter_email})
                </p>
                <div className="space-y-3">
                  <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => setFraudScope(event.target.value === 'global' ? 'global' : 'internal')}>
                    <option value="internal">Internal</option>
                    <option value="global">Global (admin approval)</option>
                  </select>
                  <Input placeholder="Reason" value={fraudReason} onChange={(event) => setFraudReason(event.target.value)} />
                  <Input type="file" accept="image/*" onChange={(event) => setFraudEvidenceFile(event.target.files?.[0] ?? null)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setReportCustomer(null)}>
                      Cancel
                    </Button>
                    <Button onClick={submitCustomerFraud}>Submit</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-8 shadow-2xl">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="mb-1 text-2xl font-bold">Application Details</h2>
                    <p className="text-muted-foreground">Order #{selectedApp.id} • Submitted {format(parseISO(selectedApp.created_at), 'MMM dd, HH:mm')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedApp(null)}>
                    &times;
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                  <div className="space-y-8">
                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name</span> <span>{selectedApp.renter_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span> <span>{selectedApp.renter_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span> <span>{selectedApp.renter_phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Billing Address</span> <span className="max-w-[200px] text-right">{selectedApp.renter_address}</span>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistics & Payment</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Mode</span> <span className="capitalize">{selectedApp.delivery_mode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Mode</span> <span className="capitalize">{selectedApp.payment_mode}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                          <span>Total Amount</span> <span>{formatPHP(selectedApp.total_amount)}</span>
                        </div>
                      </div>
                    </section>

                    {selectedApp.status === 'PENDING_REVIEW' && (
                      <div className="space-y-4 pt-4">
                        {Boolean(selectedApp.fraud_flag) && (
                          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
                            <div>
                              <p className="text-sm font-bold text-red-700">Potential Fraud Match Detected</p>
                              <p className="text-xs text-red-600">This customer matches an entry in the fraud list. Verify documents before approval.</p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-4">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedApp.id)}>
                            Approve Rental
                          </Button>
                          <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedApp.id)}>
                            Reject
                          </Button>
                        </div>
                        <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleReportFraud(selectedApp.id)}>
                          <ShieldAlert className="mr-2 h-4 w-4" /> Report as Fraud
                        </Button>
                      </div>
                    )}

                    {selectedApp.status === 'APPROVED' && (
                      <div className="pt-4">
                        <Button variant="outline" className="w-full text-red-600" onClick={() => handleCancelBooking(selectedApp.id)}>
                          <Ban className="mr-2 h-4 w-4" /> Cancel Approved Booking
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Rented Items</h4>
                      <div className="space-y-2">
                        {selectedApp.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.start_date} to {item.end_date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
