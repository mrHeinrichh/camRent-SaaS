import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import type { Booking, FraudListEntry, Item, ManualBlock, OwnerApplication, OwnerDashboardData, RentalFormField, RentalFormSchemaResponse, SupportTicket } from '@/src/types/domain';
import { exportRowsToCsv } from '@/src/lib/export';
import { Button } from '@/src/components/ui';
import type { ItemEditor, OwnerTab } from '@/src/features/owner-dashboard/types';
import { OwnerSidebar } from '@/src/features/owner-dashboard/components/OwnerSidebar';
import { OwnerTabs } from '@/src/features/owner-dashboard/components/OwnerTabs';
import { OwnerModals } from '@/src/features/owner-dashboard/components/OwnerModals';

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
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ownerNotice, setOwnerNotice] = useState<{ title: string; message: string } | null>(null);

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
      try {
        const tickets = await api.get<SupportTicket[]>('/api/owner/support-tickets');
        setSupportTickets(tickets);
      } catch {
        setSupportTickets([]);
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
    void loadData();
  }, []);

  useEffect(() => {
    const store = data?.store;
    if (!store) return;

    if (store.status === 'pending') {
      setOwnerNotice({
        title: 'Store Pending Approval',
        message:
          'Your store is still pending and is not yet publicly available. Please contact the administrator for approval.\nEmail: heinrichsorbaf02@gmail.com\nPhone: 09569749935',
      });
      return;
    }

    if (store.status === 'approved' && store.payment_due_date) {
      const dueDate = new Date(store.payment_due_date);
      if (Number.isNaN(dueDate.getTime())) return;
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        setOwnerNotice({
          title: diffDays < 0 ? 'Store Payment Overdue' : 'Store Payment Due Soon',
          message:
            diffDays < 0
              ? `Your store payment due date passed on ${dueDate.toLocaleDateString()}. Please settle immediately to avoid inactivity.\nEmail: heinrichsorbaf02@gmail.com\nPhone: 09569749935`
              : `Your store payment is due on ${dueDate.toLocaleDateString()} (in ${diffDays} day${diffDays === 1 ? '' : 's'}).\nPlease settle early to avoid inactivity.\nEmail: heinrichsorbaf02@gmail.com\nPhone: 09569749935`,
        });
      }
    }
  }, [data?.store?.status, data?.store?.payment_due_date, data?.store?.id]);

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

  const toggleItemAvailability = async (itemId: string, value: boolean) => {
    await withReload(() => api.put(`/api/items/${itemId}`, { is_available: value }), `Item marked as ${value ? 'available' : 'unavailable'}`);
  };

  const addCustomFormField = () => {
    const nextIndex = rentalFormFields.length + 1;
    setRentalFormFields((prev) => [...prev, { id: `custom_field_${nextIndex}`, label: `Custom Field ${nextIndex}`, type: 'text', required: false }]);
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

  const saveStoreProfile = async (payload: {
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
  }) => {
    await withReload(() => api.put('/api/owner/store-profile', payload), 'Store profile updated');
  };

  const exportOverviewExcel = () => {
    exportRowsToCsv(
      'overview_report.csv',
      ['Metric', 'Value'],
      [
        ['Store', data?.store?.name || ''],
        ['Total Rentals', data?.stats?.total_rentals || 0],
        ['Total Revenue', data?.stats?.total_revenue || 0],
        ['Total Customers', data?.ownerAnalytics?.totalCustomers || 0],
        ['Total Successful Rentals', data?.ownerAnalytics?.totalCustomersRented || 0],
        ['Total Profit', data?.ownerAnalytics?.totalProfit || 0],
        ['Pending', data?.ownerAnalytics?.pendingCount || 0],
        ['Reserved', data?.ownerAnalytics?.reservedCount || 0],
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
      (data?.customers || []).map((entry) => [
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
      (data?.recentTransactions || []).map((entry) => [entry.renter_name, entry.renter_email, entry.total_amount, entry.status, entry.id_types.join(', '), entry.created_at]),
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

  const createSupportTicket = async (payload: { type: SupportTicket['type']; priority: SupportTicket['priority']; subject: string; message: string }) => {
    await api.post('/api/owner/support-tickets', payload);
    await loadData();
  };

  const updateSupportTicket = async (
    id: string,
    payload: { type?: SupportTicket['type']; priority?: SupportTicket['priority']; subject?: string; message?: string; status?: SupportTicket['status'] },
  ) => {
    await api.put(`/api/owner/support-tickets/${id}`, payload);
    await loadData();
  };

  const deleteSupportTicket = async (id: string) => {
    if (!confirm('Delete this feedback/support ticket?')) return;
    await api.delete(`/api/owner/support-tickets/${id}`);
    await loadData();
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
      <OwnerSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        {ownerNotice ? (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-amber-900">{ownerNotice.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-800">{ownerNotice.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setOwnerNotice(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}
        <OwnerTabs
          activeTab={activeTab}
          data={data}
          applications={applications}
          pieSlices={pieSlices}
          displayApprovedDate={displayApprovedDate}
          onExportOverview={exportOverviewExcel}
          onExportCustomers={exportCustomersExcel}
          onExportTransactions={exportTransactionsExcel}
          onExportInventory={exportInventoryExcel}
          onExportFraud={exportFraudExcel}
          onSelectApplication={setSelectedApp}
          onSelectReportCustomer={setReportCustomer}
          onApprove={handleApprove}
          onReject={handleReject}
          onReportFraud={handleReportFraud}
          onCancelBooking={handleCancelBooking}
          inventory={inventory}
          categories={categories}
          categoryFilter={categoryFilter}
          onChangeCategoryFilter={setCategoryFilter}
          filteredInventory={filteredInventory}
          onOpenCreateEditor={openCreateEditor}
          onOpenEditEditor={openEditEditor}
          onDeleteItem={deleteItem}
          onToggleItemAvailability={toggleItemAvailability}
          onOpenBlockModal={setBlockModalItem}
          calendarLoading={calendarLoading}
          selectedCalendarItemId={selectedCalendarItemId}
          onChangeSelectedCalendarItemId={setSelectedCalendarItemId}
          onRefreshCalendar={loadCalendarData}
          calendarItems={calendarItems}
          availabilityByItem={availabilityByItem}
          rentalFormFields={rentalFormFields}
          rentalFormSettings={rentalFormSettings}
          referenceImageFile={referenceImageFile}
          onReferenceImageFileChange={setReferenceImageFile}
          onRentalFormSettingsChange={setRentalFormSettings}
          onAddCustomField={addCustomFormField}
          onUpdateCustomField={updateCustomFormField}
          onRemoveCustomField={removeCustomFormField}
          onSaveCustomForm={saveCustomForm}
          fraudEntries={fraudEntries}
          fraudAccessError={fraudAccessError}
          fraudManual={fraudManual}
          fraudScope={fraudScope}
          fraudReason={fraudReason}
          onFraudManualChange={setFraudManual}
          onFraudScopeChange={setFraudScope}
          onFraudReasonChange={setFraudReason}
          onFraudEvidenceFileChange={setFraudEvidenceFile}
          onSubmitManualFraud={submitManualFraud}
          supportTickets={supportTickets}
          onCreateSupportTicket={createSupportTicket}
          onUpdateSupportTicket={updateSupportTicket}
          onDeleteSupportTicket={deleteSupportTicket}
          onSaveStoreProfile={saveStoreProfile}
        />

        <OwnerModals
          editingOpen={editingOpen}
          editor={editor}
          editorImageFile={editorImageFile}
          editorSaving={editorSaving}
          onCloseEditor={() => setEditingOpen(false)}
          onEditorChange={setEditor}
          onEditorImageFileChange={setEditorImageFile}
          onSaveEditor={saveItem}
          blockModalItem={blockModalItem}
          blockStartDate={blockStartDate}
          blockEndDate={blockEndDate}
          blockReason={blockReason}
          onCloseBlockModal={() => setBlockModalItem(null)}
          onBlockStartDateChange={setBlockStartDate}
          onBlockEndDateChange={setBlockEndDate}
          onBlockReasonChange={setBlockReason}
          onSubmitBlockDates={submitBlockDates}
          reportCustomer={reportCustomer}
          fraudScope={fraudScope}
          fraudReason={fraudReason}
          onFraudScopeChange={setFraudScope}
          onFraudReasonChange={setFraudReason}
          onFraudEvidenceFileChange={setFraudEvidenceFile}
          onCloseReportCustomer={() => setReportCustomer(null)}
          onSubmitCustomerFraud={submitCustomerFraud}
          selectedApp={selectedApp}
          onCloseSelectedApp={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onReportFraud={handleReportFraud}
          onCancelBooking={handleCancelBooking}
        />
      </main>
    </div>
  );
}
