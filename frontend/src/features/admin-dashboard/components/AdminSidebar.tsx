import { HandHeart, LayoutDashboard, Megaphone, MessageSquare, ShieldAlert, Store as StoreIcon, Users } from 'lucide-react';
import { Button } from '@/src/components/ui';
import type { AdminTab } from '@/src/features/admin-dashboard/types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  pendingMerchants?: number;
  nearDueStores?: number;
  pendingGlobalFraud?: number;
  feedbackCount?: number;
}

export function AdminSidebar({ activeTab, onChangeTab, pendingMerchants = 0, nearDueStores = 0, pendingGlobalFraud = 0, feedbackCount = 0 }: AdminSidebarProps) {
  return (
    <aside className="w-full border-b bg-muted/20 p-2 md:w-64 md:border-b-0 md:border-r md:p-6">
      <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-visible md:pb-0">
      <Button variant={activeTab === 'stores' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('stores')}>
        <StoreIcon className="mr-2 h-4 w-4" /> Store Management
        {(pendingMerchants > 0 || nearDueStores > 0) ? (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{pendingMerchants + nearDueStores}</span>
        ) : null}
      </Button>
      <Button variant={activeTab === 'customers' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('customers')}>
        <Users className="mr-2 h-4 w-4" /> Customers
      </Button>
      <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('fraud')}>
        <ShieldAlert className="mr-2 h-4 w-4" /> Fraud Management
        {pendingGlobalFraud > 0 ? <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{pendingGlobalFraud}</span> : null}
      </Button>
      <Button variant={activeTab === 'insights' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('insights')}>
        <LayoutDashboard className="mr-2 h-4 w-4" /> Insights
      </Button>
      <Button variant={activeTab === 'support' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('support')}>
        <MessageSquare className="mr-2 h-4 w-4" /> Owner Support
        {feedbackCount > 0 ? <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{feedbackCount}</span> : null}
      </Button>
      <Button variant={activeTab === 'announcements' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('announcements')}>
        <Megaphone className="mr-2 h-4 w-4" /> Announcements
      </Button>
      <Button variant={activeTab === 'donations' ? 'secondary' : 'ghost'} className="shrink-0 justify-start whitespace-nowrap md:w-full" onClick={() => onChangeTab('donations')}>
        <HandHeart className="mr-2 h-4 w-4" /> Donations
      </Button>
      </div>
    </aside>
  );
}
