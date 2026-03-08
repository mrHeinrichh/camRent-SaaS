import { AlertTriangle } from 'lucide-react';
import { Button, Card } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { AdminDashboardData } from '@/src/types/domain';

interface StoresTabProps {
  stores: AdminDashboardData;
  onExport: () => void;
  onApproveStore: (id: string) => void;
  onToggleStoreActive: (id: string, isActive: boolean) => void;
}

export function StoresTab({ stores, onExport, onApproveStore, onToggleStoreActive }: StoresTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Store Management</h1>
        <Button variant="outline" onClick={onExport}>Export Stores Excel</Button>
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
                    <Button size="sm" onClick={() => onApproveStore(store.id)}>
                      Approve
                    </Button>
                  )}
                  {store.is_active ? (
                    <Button variant="ghost" size="sm" onClick={() => onToggleStoreActive(store.id, false)}>
                      Disable
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => onToggleStoreActive(store.id, true)}>
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
  );
}

