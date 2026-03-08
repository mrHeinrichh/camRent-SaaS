import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import { exportRowsToCsv } from '@/src/lib/export';
import type { AdminDashboardData, FraudAnalytics, FraudListEntry } from '@/src/types/domain';
import type { AdminTab, EditFraudForm } from '@/src/features/admin-dashboard/types';
import { AdminSidebar } from '@/src/features/admin-dashboard/components/AdminSidebar';
import { StoresTab } from '@/src/features/admin-dashboard/components/StoresTab';
import { CustomersTab } from '@/src/features/admin-dashboard/components/CustomersTab';
import { FraudTab } from '@/src/features/admin-dashboard/components/FraudTab';
import { InsightsTab } from '@/src/features/admin-dashboard/components/InsightsTab';
import { EditFraudModal } from '@/src/features/admin-dashboard/components/EditFraudModal';

const defaultEditFraudForm: EditFraudForm = {
  full_name: '',
  email: '',
  contact_number: '',
  scope: 'internal',
  status: 'approved',
  reason: '',
  evidence_image_url: '',
};

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stores');
  const [stores, setStores] = useState<AdminDashboardData | null>(null);
  const [fraudList, setFraudList] = useState<FraudListEntry[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);
  const [fraudSearch, setFraudSearch] = useState('');
  const [editingFraudId, setEditingFraudId] = useState<string | null>(null);
  const [savingFraud, setSavingFraud] = useState(false);
  const [editFraudForm, setEditFraudForm] = useState<EditFraudForm>(defaultEditFraudForm);
  const [globalFraudForm, setGlobalFraudForm] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    reason: '',
    evidence_image_url: '',
  });

  const loadData = async () => {
    const [storesData, list, analyticsData] = await Promise.all([
      api.get<AdminDashboardData>('/api/dashboard/admin'),
      api.get<FraudListEntry[]>('/api/admin/fraud-list'),
      api.get<FraudAnalytics>('/api/admin/fraud-analytics'),
    ]);
    setStores(storesData);
    setFraudList(list);
    setAnalytics(analyticsData);
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
    await api.post('/api/admin/fraud-list', globalFraudForm);
    setGlobalFraudForm({ full_name: '', email: '', contact_number: '', reason: '', evidence_image_url: '' });
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
    });
  };

  const handleSaveFraud = async () => {
    if (!editingFraudId) return;
    if (!editFraudForm.full_name.trim() || !editFraudForm.email.trim() || !editFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    try {
      setSavingFraud(true);
      await api.put(`/api/admin/fraud-list/${editingFraudId}`, editFraudForm);
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

