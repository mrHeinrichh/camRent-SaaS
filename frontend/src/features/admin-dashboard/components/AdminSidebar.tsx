import { LayoutDashboard, ShieldAlert, Store as StoreIcon, Users } from 'lucide-react';
import { Button } from '@/src/components/ui';
import type { AdminTab } from '@/src/features/admin-dashboard/types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
}

export function AdminSidebar({ activeTab, onChangeTab }: AdminSidebarProps) {
  return (
    <aside className="w-64 space-y-2 border-r bg-muted/20 p-6">
      <Button variant={activeTab === 'stores' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onChangeTab('stores')}>
        <StoreIcon className="mr-2 h-4 w-4" /> Store Management
      </Button>
      <Button variant={activeTab === 'customers' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onChangeTab('customers')}>
        <Users className="mr-2 h-4 w-4" /> Customers
      </Button>
      <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onChangeTab('fraud')}>
        <ShieldAlert className="mr-2 h-4 w-4" /> Fraud Management
      </Button>
      <Button variant={activeTab === 'insights' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onChangeTab('insights')}>
        <LayoutDashboard className="mr-2 h-4 w-4" /> Insights
      </Button>
    </aside>
  );
}

