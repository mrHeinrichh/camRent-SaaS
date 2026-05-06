import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import type { Booking, FraudListEntry, Item, ManualBlock, OwnerApplication, OwnerDashboardData, RentalBillingMode, RentalFormField, RentalFormSchemaResponse, SupportTicket, Voucher } from '@/src/types/domain';
import { exportRowsToCsv } from '@/src/lib/export';
import { Button } from '@/src/components/ui';
import type { ItemEditor, OwnerTab } from '@/src/features/owner-dashboard/types';
import { OwnerSidebar } from '@/src/features/owner-dashboard/components/OwnerSidebar';
import { OwnerTabs } from '@/src/features/owner-dashboard/components/OwnerTabs';
import { OwnerDetailPages } from '@/src/features/owner-dashboard/components/OwnerDetailPages';

interface UploadResponse {
  url: string;
}

const emptyEditor: ItemEditor = {
  name: '',
  description: '',
  category: '',
  brand: 'Others',
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dashboardNotice, setDashboardNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clearValidationError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editor, setEditor] = useState<ItemEditor>(emptyEditor);
  const [editorImageFile, setEditorImageFile] = useState<File | null>(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [detailView, setDetailView] = useState<'none' | 'edit-gear' | 'block-dates' | 'report-fraud' | 'application-details'>('none');
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
    requirements?: Array<{ type: string; url: string }>;
  } | null>(null);
  const [fraudScope, setFraudScope] = useState<'internal' | 'global'>('internal');
  const [fraudReason, setFraudReason] = useState('');
  const [fraudRequirementFiles, setFraudRequirementFiles] = useState<File[]>([]);
  const [fraudManual, setFraudManual] = useState({
    full_name: '',
    email: '',
    contact_number: '',
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
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
      try {
        const vouchersData = await api.get<Voucher[]>('/api/owner/vouchers');
        setVouchers(vouchersData);
      } catch {
        setVouchers([]);
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
    setDashboardNotice(null);
    setValidationErrors({});
    try {
      await task();
      setDashboardNotice({ type: 'success', message: successMessage });
      await loadData();
      setSelectedApp(null);
      setDetailView('none');
      if (activeTab === 'calendar') await loadCalendarData();
    } catch (taskError: any) {
      setDashboardNotice({ type: 'error', message: taskError.message || 'Action failed' });
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
    setDetailView('edit-gear');
  };

  const openEditEditor = (item: Item) => {
    setEditor({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      brand: item.brand || 'Others',
      daily_price: String(item.daily_price),
      stock: String(Math.max(0, item.stock || 0)),
      is_available: item.is_available !== false,
      image_url: item.image_url,
    });
    setEditorImageFile(null);
    setDetailView('edit-gear');
  };

  const saveItem = async () => {
    setDashboardNotice(null);
    setValidationErrors({});

    if (!data?.store?.id) {
       setDashboardNotice({ type: 'error', message: 'Store not found' });
       return;
    }

    const errors: Record<string, string> = {};
    if (!editor.name.trim()) errors.name = 'Name is required';
    if (!editor.category.trim()) errors.category = 'Category is required';
    if (!editor.brand.trim()) errors.brand = 'Brand is required';
    if (!editor.daily_price.trim()) errors.daily_price = 'Daily price is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload: Record<string, unknown> = {
      store_id: data.store.id,
      name: editor.name.trim(),
      description: editor.description.trim(),
      category: editor.category.trim(),
      brand: editor.brand.trim(),
      daily_price: Number(editor.daily_price),
      stock: Math.max(0, Math.floor(Number(editor.stock))),
      is_available: editor.is_available,
      image_url: editor.image_url.trim(),
    };

    if (!Number.isFinite(payload.daily_price as number)) {
      setValidationErrors({ daily_price: 'Must be a valid number' });
      return;
    }
    if (!Number.isFinite(payload.stock as number)) {
      setValidationErrors({ stock: 'Must be a valid number' });
      return;
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
      setDetailView('none');
      setEditorImageFile(null);
    } catch (saveError: any) {
      setDashboardNotice({ type: 'error', message: saveError.message || 'Failed to save item' });
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
    tiktok_url: string;
    custom_social_links?: string[];
    payment_details: string;
    rental_billing_mode?: RentalBillingMode;
    payment_detail_images?: string[];
    branches?: Array<{ name?: string; address: string; location_lat?: number | null; location_lng?: number | null }>;
    location_lat?: number | null;
    location_lng?: number | null;
  }) => {
    const errors: Record<string, string> = {};
    if (!payload.name?.trim()) errors.storeName = 'Store name is required';
    if (!payload.description?.trim()) errors.storeDescription = 'Description is required';
    if (!payload.address?.trim()) errors.storeAddress = 'Main address is required';
    if (!payload.payment_details?.trim()) errors.paymentDetails = 'Payment details are required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
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

  const createVoucher = async (payload: { code: string; discount_amount: number; is_active?: boolean }) => {
    const errors: Record<string, string> = {};
    if (!payload.code?.trim()) errors.voucherCode = 'Voucher code is required';
    if (!payload.discount_amount || payload.discount_amount <= 0) errors.voucherAmount = 'Discount amount must be greater than 0';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    await withReload(() => api.post('/api/owner/vouchers', payload), 'Voucher created');
  };

  const updateVoucher = async (id: string, payload: { code?: string; discount_amount?: number; is_active?: boolean; is_used?: boolean }) => {
    if (payload.code !== undefined || payload.discount_amount !== undefined) {
      const errors: Record<string, string> = {};
      if (payload.code !== undefined && !payload.code?.trim()) errors.voucherCode = 'Voucher code is required';
      if (payload.discount_amount !== undefined && (!payload.discount_amount || payload.discount_amount <= 0)) errors.voucherAmount = 'Discount amount must be greater than 0';

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
    }
    await withReload(() => api.put(`/api/owner/vouchers/${id}`, payload), 'Voucher updated');
  };

  const exportInventoryExcel = () => {
    exportRowsToCsv(
      'inventory_report.csv',
      ['Name', 'Category', 'Brand', 'Daily Price', 'Stock', 'Available'],
      inventory.map((item) => [item.name, item.category, item.brand || 'Others', item.daily_price, Math.max(0, item.stock || 0), item.is_available !== false ? 'Yes' : 'No']),
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
    setValidationErrors({});
    setDashboardNotice(null);
    if (!blockModalItem) return;
    
    const errors: Record<string, string> = {};
    if (!blockStartDate) errors.blockStartDate = 'Start date is required';
    if (!blockEndDate) errors.blockEndDate = 'End date is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

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
    setDetailView('none');
  };

  const submitCustomerFraud = async () => {
    setValidationErrors({});
    setDashboardNotice(null);
    if (!reportCustomer) return;

    if (!fraudReason.trim()) {
      setValidationErrors({ fraudReason: 'Reason is required' });
      return;
    }

    const uploadedRequirementFiles: Array<{ type: string; url: string }> = [];
    try {
      for (let i = 0; i < fraudRequirementFiles.length; i += 1) {
        const file = fraudRequirementFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await api.post<UploadResponse>('/api/upload/public', formData);
        uploadedRequirementFiles.push({ type: `ATTACHED_REQUIREMENT_${i + 1}`, url: uploadResult.url });
      }
      await withReload(
        () =>
          api.post('/api/owner/customers/report-fraud', {
            full_name: reportCustomer.renter_name,
            email: reportCustomer.renter_email,
            contact_number: reportCustomer.renter_phone,
            requirement_files: [...(reportCustomer.requirements || []), ...uploadedRequirementFiles],
            reason: fraudReason,
            scope: fraudScope,
          }),
        fraudScope === 'global' ? 'Global fraud request submitted for admin approval' : 'Customer flagged in internal fraud list',
      );
      setReportCustomer(null);
      setFraudScope('internal');
      setFraudReason('');
      setFraudRequirementFiles([]);
      setDetailView('none');
    } catch (err: any) {
      setDashboardNotice({ type: 'error', message: err.message || 'Failed to submit fraud report' });
    }
  };

  const submitManualFraud = async () => {
    setValidationErrors({});
    setDashboardNotice(null);

    const errors: Record<string, string> = {};
    if (!fraudManual.full_name.trim()) errors['fraudManual.full_name'] = 'Name is required';
    if (!fraudManual.email.trim()) errors['fraudManual.email'] = 'Email is required';
    if (!fraudReason.trim()) errors.fraudReason = 'Reason is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const uploadedRequirementFiles: Array<{ type: string; url: string }> = [];
    try {
      for (let i = 0; i < fraudRequirementFiles.length; i += 1) {
        const file = fraudRequirementFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await api.post<UploadResponse>('/api/upload/public', formData);
        uploadedRequirementFiles.push({ type: `ATTACHED_REQUIREMENT_${i + 1}`, url: uploadResult.url });
      }
      await withReload(
        () =>
          api.post('/api/owner/customers/report-fraud', {
            ...fraudManual,
            requirement_files: uploadedRequirementFiles,
            reason: fraudReason,
            scope: fraudScope,
          }),
        fraudScope === 'global' ? 'Global fraud request submitted for admin approval' : 'Fraud entry added',
      );
      setFraudManual({ full_name: '', email: '', contact_number: '' });
      setFraudReason('');
      setFraudScope('internal');
      setFraudRequirementFiles([]);
    } catch (err: any) {
      setDashboardNotice({ type: 'error', message: err.message || 'Failed to submit fraud report' });
    }
  };

  const handleFraudRequirementFilesChange = (files: File[]) => {
    if (files.length > 5) {
      alert('You can upload up to 5 requirement files only.');
    }
    setFraudRequirementFiles(files.slice(0, 5));
  };

  const createSupportTicket = async (payload: { type: SupportTicket['type']; priority: SupportTicket['priority']; subject: string; message: string }) => {
    const errors: Record<string, string> = {};
    if (!payload.subject?.trim()) errors.supportSubject = 'Subject is required';
    if (!payload.message?.trim()) errors.supportMessage = 'Message is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    await withReload(() => api.post('/api/owner/support-tickets', payload), 'Feedback submitted');
  };

  const updateSupportTicket = async (
    id: string,
    payload: { type?: SupportTicket['type']; priority?: SupportTicket['priority']; subject?: string; message?: string; status?: SupportTicket['status'] },
  ) => {
    if (payload.subject !== undefined || payload.message !== undefined) {
      const errors: Record<string, string> = {};
      if (payload.subject !== undefined && !payload.subject?.trim()) errors.supportSubject = 'Subject is required';
      if (payload.message !== undefined && !payload.message?.trim()) errors.supportMessage = 'Message is required';

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
    }
    await withReload(() => api.put(`/api/owner/support-tickets/${id}`, payload), 'Feedback updated');
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

  const pendingApplicationsCount = useMemo(
    () => applications.filter((application) => String(application.status || '').toUpperCase() === 'PENDING_REVIEW').length,
    [applications],
  );

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

  const handleChangeTab = (tab: OwnerTab) => {
    setActiveTab(tab);
    setDetailView('none');
    setSelectedApp(null);
    setBlockModalItem(null);
    setReportCustomer(null);
  };

  const handleBack = (tab?: OwnerTab) => {
    setDetailView('none');
    setSelectedApp(null);
    setBlockModalItem(null);
    setReportCustomer(null);
    if (tab) setActiveTab(tab);
  };

  return (
    <div className="owner-dashboard-shell relative flex min-h-[calc(100vh-64px)] flex-col overflow-hidden bg-[var(--tone-bg)] md:flex-row">
      <OwnerSidebar activeTab={activeTab} onChangeTab={handleChangeTab} pendingApplicationsCount={pendingApplicationsCount} />
      <main className="relative z-10 flex-1 overflow-auto p-4 animate-fade-up sm:p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <div className="owner-hero">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--tone-accent)]">Owner Workspace</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--tone-text)] sm:text-3xl">
                {data.store?.name || 'Store Dashboard'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--tone-text-muted)]">
                Manage bookings, inventory, customer checks, and store settings from one operational view.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="owner-hero-metric">
                <span>{pendingApplicationsCount}</span>
                <p>Pending</p>
              </div>
              <div className="owner-hero-metric">
                <span>{inventory.length}</span>
                <p>Gear</p>
              </div>
              <div className="owner-hero-metric">
                <span>{data.stats?.total_rentals || 0}</span>
                <p>Rentals</p>
              </div>
            </div>
          </div>
        {ownerNotice ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm animate-fade-up-delay">
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
        <div className="owner-content-panel">
        {detailView === 'none' ? (
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
            onSelectApplication={(application) => {
              setSelectedApp(application);
              setDetailView('application-details');
            }}
            onSelectReportCustomer={(customer) => {
              setReportCustomer(customer);
              setDetailView('report-fraud');
            }}
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
            onOpenBlockModal={(item) => {
              setBlockModalItem(item);
              setDetailView('block-dates');
            }}
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
            onFraudRequirementFilesChange={handleFraudRequirementFilesChange}
            onSubmitManualFraud={submitManualFraud}
            supportTickets={supportTickets}
            onCreateSupportTicket={createSupportTicket}
            onUpdateSupportTicket={updateSupportTicket}
            onDeleteSupportTicket={deleteSupportTicket}
            onSaveStoreProfile={saveStoreProfile}
            vouchers={vouchers}
            onCreateVoucher={createVoucher}
            onUpdateVoucher={updateVoucher}
            validationErrors={validationErrors}
            clearValidationError={clearValidationError}
          />
        ) : (
          <OwnerDetailPages
            view={detailView}
            onBack={handleBack}
            editor={editor}
            editorImageFile={editorImageFile}
            editorSaving={editorSaving}
            onEditorChange={setEditor}
            onEditorImageFileChange={setEditorImageFile}
            onSaveEditor={saveItem}
            blockModalItem={blockModalItem}
            blockStartDate={blockStartDate}
            blockEndDate={blockEndDate}
            blockReason={blockReason}
            onBlockStartDateChange={setBlockStartDate}
            onBlockEndDateChange={setBlockEndDate}
            onBlockReasonChange={setBlockReason}
            onSubmitBlockDates={submitBlockDates}
            reportCustomer={reportCustomer}
            fraudScope={fraudScope}
            fraudReason={fraudReason}
            onFraudScopeChange={setFraudScope}
            onFraudReasonChange={setFraudReason}
            onFraudRequirementFilesChange={handleFraudRequirementFilesChange}
            onSubmitCustomerFraud={submitCustomerFraud}
            selectedApp={selectedApp}
            onApprove={handleApprove}
            onReject={handleReject}
            onReportFraud={handleReportFraud}
            onCancelBooking={handleCancelBooking}
            validationErrors={validationErrors}
            clearValidationError={clearValidationError}
          />
        )}
        </div>
        </div>
      </main>
    </div>
  );
}
