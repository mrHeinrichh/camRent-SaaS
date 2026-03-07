import { useEffect, useState } from 'react';
import { Globe, LayoutDashboard, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '@/src/lib/api';
import type { FraudAnalytics, FraudListEntry } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'fraud' | 'analytics'>('fraud');
  const [fraudList, setFraudList] = useState<FraudListEntry[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);

  const loadData = async () => {
    const [list, analyticsData] = await Promise.all([
      api.get<FraudListEntry[]>('/api/admin/fraud-list'),
      api.get<FraudAnalytics>('/api/admin/fraud-analytics'),
    ]);
    setFraudList(list);
    setAnalytics(analyticsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGlobalize = async (id: string) => {
    await api.post(`/api/admin/fraud-list/globalize/${id}`);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    await api.delete(`/api/admin/fraud-list/${id}`);
    loadData();
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 space-y-2 border-r bg-muted/20 p-6">
        <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('fraud')}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Fraud Management
        </Button>
        <Button variant={activeTab === 'analytics' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('analytics')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Analytics
        </Button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'fraud' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Fraud Management</h1>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search fraud list..." />
              </div>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Reported Person</th>
                    <th className="p-4 text-sm font-semibold">Contact Info</th>
                    <th className="p-4 text-sm font-semibold">Reason</th>
                    <th className="p-4 text-sm font-semibold">Scope</th>
                    <th className="p-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fraudList.map((entry) => (
                    <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <p className="font-medium">{entry.full_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.billing_address}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">{entry.contact_number}</p>
                      </td>
                      <td className="p-4">
                        <p className="line-clamp-1 text-sm">{entry.reason}</p>
                        <p className="text-[10px] text-muted-foreground">By: {entry.reported_by_email}</p>
                      </td>
                      <td className="p-4">
                        {entry.store_id ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Store: {entry.store_name}</span>
                        ) : (
                          <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                            <Globe className="h-2 w-2" /> Global
                          </span>
                        )}
                      </td>
                      <td className="space-x-2 p-4 text-right">
                        {entry.store_id && (
                          <Button variant="ghost" size="sm" onClick={() => handleGlobalize(entry.id)}>
                            Globalize
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

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Fraud Analytics</h1>
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
    </div>
  );
}
