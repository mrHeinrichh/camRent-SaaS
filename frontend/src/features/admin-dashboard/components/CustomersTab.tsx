import { useEffect, useMemo, useState } from 'react';
import { PaginationControls } from '@/src/components/PaginationControls';
import { Button, Card } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { User } from '@/src/types/domain';

interface CustomersTabProps {
  customers: User[];
  customerInsights?: Array<{
    customer_id: string;
    full_name: string;
    email: string;
    is_active: boolean;
    transaction_count: number;
    successful_transactions: number;
    total_spent: number;
    last_transaction_at?: string | null;
  }>;
  onExport: () => void;
  onToggleCustomerActive: (id: string, isActive: boolean) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomersTab({ customers, customerInsights = [], onExport, onToggleCustomerActive, onDeleteCustomer }: CustomersTabProps) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const insightByEmail = new Map(customerInsights.map((insight) => [String(insight.email || '').toLowerCase(), insight]));
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const pagedCustomers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return customers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [customers, page]);

  useEffect(() => {
    setPage(1);
  }, [customers.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button variant="outline" onClick={onExport}>Export Customers Excel</Button>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 p-4">
          <h3 className="text-lg font-bold">Customer Accounts</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-sm font-semibold">Customer</th>
              <th className="p-4 text-sm font-semibold">Transactions</th>
              <th className="p-4 text-sm font-semibold">Successful</th>
              <th className="p-4 text-sm font-semibold">Total Spent</th>
              <th className="p-4 text-sm font-semibold">Last Transaction</th>
              <th className="p-4 text-sm font-semibold">Status</th>
              <th className="p-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCustomers.map((customer) => {
              const insight = insightByEmail.get(String(customer.email || '').toLowerCase());
              return (
                <tr key={customer.id} className="border-t">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={customer.avatar_url || 'https://placehold.co/36x36?text=U'}
                        alt="Customer profile"
                        className="h-9 w-9 rounded-full border object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{insight?.transaction_count || 0}</td>
                  <td className="p-4 text-sm">{insight?.successful_transactions || 0}</td>
                  <td className="p-4 text-sm">{formatPHP(insight?.total_spent || 0)}</td>
                  <td className="p-4 text-sm">{insight?.last_transaction_at ? new Date(insight.last_transaction_at).toLocaleDateString() : '-'}</td>
                <td className="p-4 text-sm">
                  {customer.is_active === false ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">disabled</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">active</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onToggleCustomerActive(customer.id, customer.is_active === false)}>
                    {customer.is_active === false ? 'Enable' : 'Disable'}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeleteCustomer(customer.id)}>
                    Delete
                  </Button>
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <PaginationControls page={page} totalPages={totalPages} totalItems={customers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
