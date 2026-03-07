import { useEffect, useState } from 'react';
import { AlertTriangle, Globe, LayoutDashboard, Search, ShieldAlert, Store as StoreIcon, Trash2 } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { exportRowsToCsv } from '@/src/lib/export';
import type { AdminDashboardData, FraudAnalytics, FraudListEntry } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'stores' | 'customers' | 'fraud' | 'insights'>('stores');
  const [stores, setStores] = useState<AdminDashboardData | null>(null);
  const [fraudList, setFraudList] = useState<FraudListEntry[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);
  const [fraudSearch, setFraudSearch] = useState('');
  const [editingFraudId, setEditingFraudId] = useState<string | null>(null);
  const [savingFraudId, setSavingFraudId] = useState<string | null>(null);
  const [editFraudForm, setEditFraudForm] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    scope: 'internal' as 'internal' | 'global',
    status: 'approved' as 'approved' | 'pending',
    reason: '',
    evidence_image_url: '',
  });
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
    loadData();
  }, []);

  const handleGlobalize = async (id: string) => {
    await api.post(`/api/admin/fraud-list/${id}/approve-global`);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    await api.delete(`/api/admin/fraud-list/${id}`);
    loadData();
  };

  const handleStartEditFraud = (entry: FraudListEntry) => {
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

  const handleSaveFraud = async (id: string) => {
    if (!editFraudForm.full_name.trim() || !editFraudForm.email.trim() || !editFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    try {
      setSavingFraudId(id);
      await api.put(`/api/admin/fraud-list/${id}`, editFraudForm);
      setEditingFraudId(null);
      await loadData();
    } finally {
      setSavingFraudId(null);
    }
  };

  const handleApproveStore = async (id: string) => {
    await api.post(`/api/admin/stores/${id}/approve`);
    loadData();
  };

  const handleToggleStoreActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/stores/${id}/active`, { isActive });
    loadData();
  };

  const handleToggleCustomerActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/customers/${id}/active`, { isActive });
    loadData();
  };

  const handleCreateGlobalFraud = async () => {
    if (!globalFraudForm.full_name.trim() || !globalFraudForm.email.trim() || !globalFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    await api.post('/api/admin/fraud-list', globalFraudForm);
    setGlobalFraudForm({ full_name: '', email: '', contact_number: '', reason: '', evidence_image_url: '' });
    loadData();
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

  const filteredFraudList = fraudList.filter((entry) => {
    const haystack = `${entry.full_name} ${entry.email} ${entry.contact_number} ${entry.reason} ${entry.scope || ''} ${entry.status || ''}`.toLowerCase();
    return haystack.includes(fraudSearch.trim().toLowerCase());
  });

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 space-y-2 border-r bg-muted/20 p-6">
        <Button variant={activeTab === 'stores' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('stores')}>
          <StoreIcon className="mr-2 h-4 w-4" /> Store Management
        </Button>
        <Button variant={activeTab === 'customers' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('customers')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Customers
        </Button>
        <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('fraud')}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Fraud Management
        </Button>
        <Button variant={activeTab === 'insights' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('insights')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Insights
        </Button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'stores' && stores && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Store Management</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportStoresExcel}>Export Stores Excel</Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Store</th>
                    <th className="p-4 text-sm font-semibold">Status</th>
                    <th className="p-4 text-sm font-semibold">Active</th>
                    <th className="p-4 text-sm font-semibold">Approved Date</th>
                    <th className="p-4 text-sm font-semibold">Payment Due</th>
                    <th className="p-4 text-sm font-semibold">Income</th>
                    <th className="p-4 text-sm font-semibold">Assets</th>
                    <th className="p-4 text-sm font-semibold">Customers</th>
                    <th className="p-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.allStores.map((store) => (
                    <tr key={store.id} className="border-t transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <p className="font-medium">{store.name}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{store.address || 'No address provided'}</p>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">{store.status}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            store.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {store.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{store.approved_at ? new Date(store.approved_at).toLocaleDateString() : '-'}</td>
                      <td className="p-4">
                        {store.payment_due_date ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span>{new Date(store.payment_due_date).toLocaleDateString()}</span>
                            {(() => {
                              const now = new Date();
                              const due = new Date(store.payment_due_date!);
                              const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              if (diffDays <= 7 && diffDays >= 0) {
                                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
                              }
                              if (diffDays < 0) {
                                return <AlertTriangle className="h-4 w-4 text-red-500" />;
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No due date</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {formatPHP((stores.storeInsights || []).find((entry) => entry.store_id === store.id)?.income || 0)}
                      </td>
                      <td className="p-4 text-sm">
                        {formatPHP((stores.storeInsights || []).find((entry) => entry.store_id === store.id)?.assets_value || 0)}
                      </td>
                      <td className="p-4 text-sm">{(stores.storeInsights || []).find((entry) => entry.store_id === store.id)?.customers_count || 0}</td>
                      <td className="space-x-2 p-4 text-right">
                        {store.status === 'pending' && (
                          <Button size="sm" onClick={() => handleApproveStore(store.id)}>
                            Approve
                          </Button>
                        )}
                        {store.is_active ? (
                          <Button variant="ghost" size="sm" onClick={() => handleToggleStoreActive(store.id, false)}>
                            Disable
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleToggleStoreActive(store.id, true)}>
                            Enable
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'customers' && stores && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Customers</h1>
              <Button variant="outline" onClick={exportCustomersExcel}>Export Customers Excel</Button>
            </div>
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 p-4">
                <h3 className="text-lg font-bold">Customer Accounts</h3>
              </div>
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Customer</th>
                    <th className="p-4 text-sm font-semibold">Status</th>
                    <th className="p-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(stores.customers || []).map((customer) => (
                    <tr key={customer.id} className="border-t">
                      <td className="p-4">
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </td>
                      <td className="p-4 text-sm">
                        {customer.is_active === false ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">disabled</span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">active</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleCustomerActive(customer.id, customer.is_active === false)}>
                          {customer.is_active === false ? 'Enable' : 'Disable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Fraud Management</h1>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportFraudExcel}>Export Fraud Excel</Button>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search fraud list..." value={fraudSearch} onChange={(event) => setFraudSearch(event.target.value)} />
                </div>
              </div>
            </div>

            <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <Input placeholder="Full name" value={globalFraudForm.full_name} onChange={(event) => setGlobalFraudForm((prev) => ({ ...prev, full_name: event.target.value }))} />
              <Input placeholder="Email" value={globalFraudForm.email} onChange={(event) => setGlobalFraudForm((prev) => ({ ...prev, email: event.target.value }))} />
              <Input placeholder="Contact number" value={globalFraudForm.contact_number} onChange={(event) => setGlobalFraudForm((prev) => ({ ...prev, contact_number: event.target.value }))} />
              <Input placeholder="Reason" value={globalFraudForm.reason} onChange={(event) => setGlobalFraudForm((prev) => ({ ...prev, reason: event.target.value }))} />
              <Input placeholder="Evidence image URL (optional)" value={globalFraudForm.evidence_image_url} onChange={(event) => setGlobalFraudForm((prev) => ({ ...prev, evidence_image_url: event.target.value }))} />
              <div className="md:col-span-2">
                <Button onClick={handleCreateGlobalFraud}>Add Global Fraud</Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Reported Person</th>
                    <th className="p-4 text-sm font-semibold">Contact Info</th>
                    <th className="p-4 text-sm font-semibold">Reason</th>
                    <th className="p-4 text-sm font-semibold">Scope</th>
                    <th className="p-4 text-sm font-semibold">Status</th>
                    <th className="p-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFraudList.map((entry) => (
                    <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <p className="font-medium">{entry.full_name}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">{entry.contact_number}</p>
                      </td>
                      <td className="p-4">
                        <p className="line-clamp-2 text-sm">{entry.reason}</p>
                        {entry.global_request_reason ? <p className="text-[10px] text-muted-foreground">Global request: {entry.global_request_reason}</p> : null}
                        {entry.evidence_image_url ? (
                          <a href={entry.evidence_image_url} target="_blank" rel="noreferrer" className="text-[10px] underline">
                            View evidence
                          </a>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground">By: {entry.reported_by_email}</p>
                      </td>
                      <td className="p-4">
                        {entry.scope === 'global' ? (
                          <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                            <Globe className="h-2 w-2" /> Global
                          </span>
                        ) : entry.store_id ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Store: {entry.store_name}</span>
                        ) : (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Internal</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${entry.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {entry.status || 'approved'}
                        </span>
                      </td>
                      <td className="space-x-2 p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleStartEditFraud(entry)}>
                          Edit
                        </Button>
                        {entry.scope === 'global' && entry.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleGlobalize(entry.id)}>
                            Approve Global
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && analytics && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Insights</h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Stores</p>
                <p className="text-2xl font-bold">{stores?.allStores.length || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold">{formatPHP(stores?.systemSummary?.totalIncome || 0)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Assets Value</p>
                <p className="text-2xl font-bold">{formatPHP(stores?.systemSummary?.totalAssetsValue || 0)}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold">Store Income/Assets/Customers</h3>
              <div className="space-y-3">
                {(stores?.storeInsights || [])
                  .slice()
                  .sort((a, b) => b.income - a.income)
                  .slice(0, 8)
                  .map((entry) => (
                    <div key={entry.store_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{entry.store_name}</span>
                        <span className="font-semibold">{formatPHP(entry.income)}</span>
                      </div>
                      <div className="h-2 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${Math.min(100, (entry.income / Math.max(1, (stores?.storeInsights || [])[0]?.income || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Assets: {formatPHP(entry.assets_value)} ({entry.assets_count} units) • Customers: {entry.customers_count}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold">Top Stores by Income</h3>
              <div className="space-y-3">
                {(stores?.storeInsights || [])
                  .slice()
                  .sort((a, b) => b.income - a.income)
                  .slice(0, 10)
                  .map((entry) => (
                    <div key={entry.store_id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{entry.store_name}</span>
                        <span className="font-bold">{formatPHP(entry.income)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (entry.income / Math.max(1, (stores?.storeInsights || [])[0]?.income || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 font-bold">Most Reported Emails</h3>
                <div className="space-y-3">
                  {analytics.mostReportedEmails.map((item) => (
                    <div key={item.email} className="flex items-center justify-between rounded bg-muted/30 p-2">
                      <span className="text-sm">{item.email}</span>
                      <span className="font-bold">{item.count} reports</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-4 font-bold">Fraud Rate per Store</h3>
                <div className="space-y-3">
                  {analytics.fraudRatePerStore.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-bold">{Math.round(item.fraud_rate)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${item.fraud_rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {editingFraudId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold">Edit Fraud Entry</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                placeholder="Full name"
                value={editFraudForm.full_name}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, full_name: event.target.value }))}
              />
              <Input
                placeholder="Email"
                value={editFraudForm.email}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <Input
                placeholder="Contact number"
                value={editFraudForm.contact_number}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, contact_number: event.target.value }))}
              />
              <select
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={editFraudForm.scope}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, scope: event.target.value === 'global' ? 'global' : 'internal' }))}
              >
                <option value="internal">Internal</option>
                <option value="global">Global</option>
              </select>
              <select
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={editFraudForm.status}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, status: event.target.value === 'pending' ? 'pending' : 'approved' }))}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
              <Input
                placeholder="Evidence image URL"
                value={editFraudForm.evidence_image_url}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, evidence_image_url: event.target.value }))}
              />
              <Input
                className="md:col-span-2"
                placeholder="Reason"
                value={editFraudForm.reason}
                onChange={(event) => setEditFraudForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingFraudId(null);
                  setSavingFraudId(null);
                }}
                disabled={savingFraudId === editingFraudId}
              >
                Cancel
              </Button>
              <Button onClick={() => handleSaveFraud(editingFraudId)} disabled={savingFraudId === editingFraudId}>
                {savingFraudId === editingFraudId ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
