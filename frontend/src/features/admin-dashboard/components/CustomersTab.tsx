import { Button, Card } from '@/src/components/ui';
import type { User } from '@/src/types/domain';

interface CustomersTabProps {
  customers: User[];
  onExport: () => void;
  onToggleCustomerActive: (id: string, isActive: boolean) => void;
}

export function CustomersTab({ customers, onExport, onToggleCustomerActive }: CustomersTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button variant="outline" onClick={onExport}>Export Customers Excel</Button>
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
            {customers.map((customer) => (
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
                  <Button variant="ghost" size="sm" onClick={() => onToggleCustomerActive(customer.id, customer.is_active === false)}>
                    {customer.is_active === false ? 'Enable' : 'Disable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

