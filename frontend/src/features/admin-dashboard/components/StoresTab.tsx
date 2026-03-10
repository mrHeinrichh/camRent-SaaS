import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PaginationControls } from '@/src/components/PaginationControls';
import { Button, Card } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { AdminDashboardData } from '@/src/types/domain';

interface StoresTabProps {
  stores: AdminDashboardData;
  onExport: () => void;
  onApproveStore: (id: string) => void;
  onToggleStoreActive: (id: string, isActive: boolean) => void;
  onDeleteStore: (id: string) => void;
  onDeleteUser: (ownerId: string) => void;
}

export function StoresTab({ stores, onExport, onApproveStore, onToggleStoreActive, onDeleteStore, onDeleteUser }: StoresTabProps) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const pendingMerchants = stores.systemSummary?.pendingMerchants || stores.pendingStores.length || 0;
  const nearDueStores = stores.systemSummary?.nearDueStores || 0;
  const overdueStores = stores.systemSummary?.overdueStores || 0;
  const allStores = stores.allStores || [];
  const totalPages = Math.max(1, Math.ceil(allStores.length / PAGE_SIZE));
  const pagedStores = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return allStores.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allStores, page]);

  useEffect(() => {
    setPage(1);
  }, [allStores.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Store Management</h1>
        <Button variant="outline" onClick={onExport}>Export Stores Excel</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Merchant Applicants</p>
          <p className="text-2xl font-bold">{pendingMerchants}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Near Due (within 7 days)</p>
          <p className="inline-flex items-center gap-2 text-2xl font-bold">
            {nearDueStores}
            {nearDueStores > 0 ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : null}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overdue Stores</p>
          <p className="inline-flex items-center gap-2 text-2xl font-bold">
            {overdueStores}
            {overdueStores > 0 ? <AlertTriangle className="h-5 w-5 text-red-500" /> : null}
          </p>
        </Card>
      </div>

      {nearDueStores > 0 || overdueStores > 0 ? (
        <Card className="border-amber-300 bg-amber-50/60 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Warning: Some merchant accounts are near due or already overdue. Review payment due dates below.
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 touch-pan-x">
        <table className="min-w-[1120px] w-full border-collapse text-left">
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
              <th className="p-4 text-sm font-semibold">Ratings</th>
              <th className="p-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedStores.map((store) => (
              <tr key={store.id} className="border-t align-top transition-colors hover:bg-muted/30">
                <td className="p-4">
                  {(() => {
                    const row = (stores.storeInsights || []).find((entry) => entry.store_id === store.id);
                    const logoUrl = String(row?.store_logo_url || store.logo_url || '').trim();
                    const ownerAvatar = String(row?.owner_avatar_url || '').trim();
                    return (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <img
                            src={logoUrl || 'https://placehold.co/56x56?text=Store'}
                            alt="Store logo"
                            className="h-14 w-14 rounded-lg border object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{store.address || 'No address provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1">
                          <img
                            src={ownerAvatar || 'https://placehold.co/28x28?text=U'}
                            alt="User profile"
                            className="h-7 w-7 rounded-full border object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{row?.owner_name || 'User'}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{row?.owner_email || '-'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
                <td className="p-4 text-sm">
                  {(() => {
                    const row = (stores.storeInsights || []).find((entry) => entry.store_id === store.id);
                    const avg = Number(row?.average_rating || 0).toFixed(1);
                    const total = row?.total_reviews || 0;
                    return `${avg} (${total})`;
                  })()}
                </td>
                <td className="space-x-2 p-4 text-right">
                  {(() => {
                    const row = (stores.storeInsights || []).find((entry) => entry.store_id === store.id);
                    return (
                      <>
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
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeleteStore(store.id)}>
                    Delete Store
                  </Button>
                  {row?.owner_id ? (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeleteUser(row.owner_id!)}>
                      Delete User
                    </Button>
                  ) : null}
                      </>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <PaginationControls page={page} totalPages={totalPages} totalItems={allStores.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
