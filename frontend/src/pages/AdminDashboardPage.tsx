import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import { exportRowsToCsv } from '@/src/lib/export';
import type { AdminDashboardData, Announcement, FraudAnalytics, FraudListEntry, SupportTicket } from '@/src/types/domain';
import type { AdminTab, EditFraudForm } from '@/src/features/admin-dashboard/types';
import { AdminSidebar } from '@/src/features/admin-dashboard/components/AdminSidebar';
import { StoresTab } from '@/src/features/admin-dashboard/components/StoresTab';
import { CustomersTab } from '@/src/features/admin-dashboard/components/CustomersTab';
import { FraudTab } from '@/src/features/admin-dashboard/components/FraudTab';
import { InsightsTab } from '@/src/features/admin-dashboard/components/InsightsTab';
import { EditFraudModal } from '@/src/features/admin-dashboard/components/EditFraudModal';
import { SupportTab } from '@/src/features/admin-dashboard/components/SupportTab';
import { AnnouncementsTab } from '@/src/features/admin-dashboard/components/AnnouncementsTab';

const defaultEditFraudForm: EditFraudForm = {
  full_name: '',
  email: '',
  contact_number: '',
  scope: 'internal',
  status: 'approved',
  reason: '',
  evidence_image_url: '',
  requirement_files_text: '',
};

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stores');
  const [stores, setStores] = useState<AdminDashboardData | null>(null);
  const [fraudList, setFraudList] = useState<FraudListEntry[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<{
    title: string;
    description: string;
    image_url: string;
    cta_label: string;
    cta_url: string;
    is_active: boolean;
    sort_order: string;
    imageFile: File | null;
  }>({
    title: '',
    description: '',
    image_url: '',
    cta_label: '',
    cta_url: '',
    is_active: true,
    sort_order: '0',
    imageFile: null,
  });
  const [fraudSearch, setFraudSearch] = useState('');
  const [editingFraudId, setEditingFraudId] = useState<string | null>(null);
  const [savingFraud, setSavingFraud] = useState(false);
  const [editFraudForm, setEditFraudForm] = useState<EditFraudForm>(defaultEditFraudForm);
  const [globalFraudForm, setGlobalFraudForm] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    requirement_files_text: '',
    reason: '',
    evidence_image_url: '',
  });

  const loadData = async () => {
    const [storesData, list, analyticsData, supportData, announcementData] = await Promise.all([
      api.get<AdminDashboardData>('/api/dashboard/admin'),
      api.get<FraudListEntry[]>('/api/admin/fraud-list'),
      api.get<FraudAnalytics>('/api/admin/fraud-analytics'),
      api.get<SupportTicket[]>('/api/admin/support-tickets'),
      api.get<Announcement[]>('/api/admin/announcements'),
    ]);
    setStores(storesData);
    setFraudList(list);
    setAnalytics(analyticsData);
    setSupportTickets(supportData);
    setAnnouncements(announcementData);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredFraudList = useMemo(
    () =>
      fraudList.filter((entry) => {
        const haystack = `${entry.full_name} ${entry.email} ${entry.contact_number} ${entry.reason} ${entry.scope || ''} ${entry.status || ''}`.toLowerCase();
        return haystack.includes(fraudSearch.trim().toLowerCase());
      }),
    [fraudList, fraudSearch],
  );

  const handleApproveStore = async (id: string) => {
    await api.post(`/api/admin/stores/${id}/approve`);
    await loadData();
  };

  const handleToggleStoreActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/stores/${id}/active`, { isActive });
    await loadData();
  };

  const handleToggleCustomerActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/customers/${id}/active`, { isActive });
    await loadData();
  };

  const handleCreateGlobalFraud = async () => {
    if (!globalFraudForm.full_name.trim() || !globalFraudForm.email.trim() || !globalFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    await api.post('/api/admin/fraud-list', {
      ...globalFraudForm,
      requirement_files: globalFraudForm.requirement_files_text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [typePart, ...urlParts] = line.split('|');
          const maybeUrl = (urlParts.length ? urlParts.join('|') : typePart).trim();
          const maybeType = (urlParts.length ? typePart : `ATTACHMENT_${index + 1}`).trim();
          return { type: maybeType || `ATTACHMENT_${index + 1}`, url: maybeUrl };
        })
        .filter((entry) => entry.url),
    });
    setGlobalFraudForm({
      full_name: '',
      email: '',
      contact_number: '',
      requirement_files_text: '',
      reason: '',
      evidence_image_url: '',
    });
    await loadData();
  };

  const handleEditFraud = (entry: FraudListEntry) => {
    setEditingFraudId(entry.id);
    setEditFraudForm({
      full_name: entry.full_name || '',
      email: entry.email || '',
      contact_number: entry.contact_number || '',
      scope: entry.scope === 'global' ? 'global' : 'internal',
      status: entry.status === 'pending' ? 'pending' : 'approved',
      reason: entry.reason || '',
      evidence_image_url: entry.evidence_image_url || '',
      requirement_files_text: (entry.requirement_files || [])
        .map((file) => `${file.type || 'ATTACHMENT'}|${file.url}`)
        .join('\n'),
    });
  };

  const handleSaveFraud = async () => {
    if (!editingFraudId) return;
    if (!editFraudForm.full_name.trim() || !editFraudForm.email.trim() || !editFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    try {
      setSavingFraud(true);
      await api.put(`/api/admin/fraud-list/${editingFraudId}`, {
        ...editFraudForm,
        requirement_files: editFraudForm.requirement_files_text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => {
            const [typePart, ...urlParts] = line.split('|');
            const maybeUrl = (urlParts.length ? urlParts.join('|') : typePart).trim();
            const maybeType = (urlParts.length ? typePart : `ATTACHMENT_${index + 1}`).trim();
            return { type: maybeType || `ATTACHMENT_${index + 1}`, url: maybeUrl };
          })
          .filter((entry) => entry.url),
      });
      setEditingFraudId(null);
      await loadData();
    } finally {
      setSavingFraud(false);
    }
  };

  const handleDeleteFraud = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    await api.delete(`/api/admin/fraud-list/${id}`);
    await loadData();
  };

  const handleApproveGlobal = async (id: string) => {
    await api.post(`/api/admin/fraud-list/${id}/approve-global`);
    await loadData();
  };

  const exportStoresExcel = () => {
    exportRowsToCsv(
      'superadmin_stores.csv',
      ['Store', 'Status', 'Active', 'Approved Date', 'Due Date', 'Income', 'Assets Value', 'Assets Count', 'Customers'],
      (stores?.storeInsights || []).map((entry) => {
        const store = stores?.allStores.find((item) => item.id === entry.store_id);
        return [
          entry.store_name,
          store?.status || '',
          store?.is_active ? 'active' : 'inactive',
          store?.approved_at || '',
          store?.payment_due_date || '',
          entry.income,
          entry.assets_value,
          entry.assets_count,
          entry.customers_count,
        ];
      }),
    );
  };

  const exportFraudExcel = () => {
    exportRowsToCsv(
      'superadmin_fraud.csv',
      ['Name', 'Email', 'Phone', 'Scope', 'Status', 'Reason'],
      fraudList.map((entry) => [entry.full_name, entry.email, entry.contact_number, entry.scope || '', entry.status || '', entry.reason]),
    );
  };

  const exportCustomersExcel = () => {
    exportRowsToCsv(
      'superadmin_customers.csv',
      ['Name', 'Email', 'Active'],
      (stores?.customers || []).map((customer) => [customer.full_name, customer.email, customer.is_active === false ? 'disabled' : 'active']),
    );
  };

  const exportSupportExcel = () => {
    exportRowsToCsv(
      'superadmin_support.csv',
      ['Store', 'Owner', 'Email', 'Type', 'Subject', 'Status', 'Priority', 'Created At', 'Updated At'],
      supportTickets.map((ticket) => [
        ticket.store_name || '',
        ticket.owner_name || '',
        ticket.owner_email || '',
        ticket.type,
        ticket.subject,
        ticket.status,
        ticket.priority,
        ticket.created_at,
        ticket.updated_at,
      ]),
    );
  };

  const handleUpdateSupportTicket = async (
    id: string,
    payload: { status?: SupportTicket['status']; priority?: SupportTicket['priority']; admin_reply?: string },
  ) => {
    await api.put(`/api/admin/support-tickets/${id}`, payload);
    await loadData();
  };

  const handleDeleteSupportTicket = async (id: string) => {
    if (!confirm('Delete this support ticket?')) return;
    await api.delete(`/api/admin/support-tickets/${id}`);
    await loadData();
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({
      title: announcement.title || '',
      description: announcement.description || '',
      image_url: announcement.image_url || '',
      cta_label: announcement.cta_label || '',
      cta_url: announcement.cta_url || '',
      is_active: announcement.is_active !== false,
      sort_order: String(announcement.sort_order ?? 0),
      imageFile: null,
    });
  };

  const handleSubmitAnnouncement = async () => {
    if (!announcementForm.title.trim() && !announcementForm.description.trim() && !announcementForm.image_url.trim() && !announcementForm.imageFile) {
      return alert('Add at least text (title/description) or image');
    }
    try {
      setAnnouncementSaving(true);
      let nextImageUrl = announcementForm.image_url.trim();
      if (announcementForm.imageFile) {
        const form = new FormData();
        form.append('file', announcementForm.imageFile);
        const upload = await api.post<{ url: string }>('/api/upload/public', form);
        nextImageUrl = upload.url;
      }
      const payload = {
        title: announcementForm.title.trim(),
        description: announcementForm.description.trim(),
        image_url: nextImageUrl,
        cta_label: announcementForm.cta_label.trim(),
        cta_url: announcementForm.cta_url.trim(),
        is_active: announcementForm.is_active,
        sort_order: Number(announcementForm.sort_order || 0),
      };
      if (editingAnnouncementId) {
        await api.put(`/api/admin/announcements/${editingAnnouncementId}`, payload);
      } else {
        await api.post('/api/admin/announcements', payload);
      }
      setEditingAnnouncementId(null);
      setAnnouncementForm({
        title: '',
        description: '',
        image_url: '',
        cta_label: '',
        cta_url: '',
        is_active: true,
        sort_order: '0',
        imageFile: null,
      });
      await loadData();
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/api/admin/announcements/${id}`);
    await loadData();
  };

  const exportAnnouncementsExcel = () => {
    exportRowsToCsv(
      'superadmin_announcements.csv',
      ['Title', 'Description', 'Image URL', 'CTA Label', 'CTA URL', 'Active', 'Sort Order', 'Updated'],
      announcements.map((entry) => [
        entry.title,
        entry.description || '',
        entry.image_url || '',
        entry.cta_label || '',
        entry.cta_url || '',
        entry.is_active ? 'yes' : 'no',
        entry.sort_order,
        entry.updated_at,
      ]),
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar activeTab={activeTab} onChangeTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'stores' && stores && (
          <StoresTab
            stores={stores}
            onExport={exportStoresExcel}
            onApproveStore={handleApproveStore}
            onToggleStoreActive={handleToggleStoreActive}
          />
        )}

        {activeTab === 'customers' && stores && (
          <CustomersTab customers={stores.customers || []} onExport={exportCustomersExcel} onToggleCustomerActive={handleToggleCustomerActive} />
        )}

        {activeTab === 'fraud' && (
          <FraudTab
            fraudList={filteredFraudList}
            fraudSearch={fraudSearch}
            onFraudSearchChange={setFraudSearch}
            globalFraudForm={globalFraudForm}
            onGlobalFraudFormChange={setGlobalFraudForm}
            onCreateGlobalFraud={handleCreateGlobalFraud}
            onEdit={handleEditFraud}
            onApproveGlobal={handleApproveGlobal}
            onDelete={handleDeleteFraud}
            onExport={exportFraudExcel}
          />
        )}

        {activeTab === 'insights' && analytics && <InsightsTab stores={stores} analytics={analytics} />}

        {activeTab === 'support' && (
          <SupportTab tickets={supportTickets} onExport={exportSupportExcel} onUpdateTicket={handleUpdateSupportTicket} onDeleteTicket={handleDeleteSupportTicket} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab
            announcements={announcements}
            form={announcementForm}
            editingId={editingAnnouncementId}
            saving={announcementSaving}
            onFormChange={(next) => setAnnouncementForm((prev) => ({ ...prev, ...next }))}
            onSubmit={handleSubmitAnnouncement}
            onEdit={handleEditAnnouncement}
            onDelete={handleDeleteAnnouncement}
            onExport={exportAnnouncementsExcel}
          />
        )}
      </main>

      <EditFraudModal
        open={Boolean(editingFraudId)}
        form={editFraudForm}
        saving={savingFraud}
        onChange={setEditFraudForm}
        onCancel={() => {
          setEditingFraudId(null);
          setSavingFraud(false);
          setEditFraudForm(defaultEditFraudForm);
        }}
        onSave={handleSaveFraud}
      />
    </div>
  );
}
