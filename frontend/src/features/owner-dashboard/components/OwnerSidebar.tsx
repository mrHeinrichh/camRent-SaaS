import {
  Calendar as CalendarIcon,
  Camera,
  Clock,
  LayoutDashboard,
  MessageSquare,
  ReceiptText,
  ShieldAlert,
  SlidersHorizontal,
  TicketPercent,
  Users,
} from 'lucide-react';
import { cn } from '@/src/components/ui';
import type { OwnerTab } from '@/src/features/owner-dashboard/types';

interface OwnerSidebarProps {
  activeTab: OwnerTab;
  onChangeTab: (tab: OwnerTab) => void;
  pendingApplicationsCount?: number;
}

const ownerNavItems: Array<{
  tab: OwnerTab;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  { tab: 'overview', label: 'Overview', description: 'Store health', icon: LayoutDashboard },
  { tab: 'applications', label: 'Applications', description: 'Review renters', icon: Clock },
  { tab: 'inventory', label: 'Inventory', description: 'Manage gear', icon: Camera },
  { tab: 'calendar', label: 'Calendar', description: 'Availability', icon: CalendarIcon },
  { tab: 'customers', label: 'Customers', description: 'Renter records', icon: Users },
  { tab: 'transactions', label: 'Transactions', description: 'Rental history', icon: ReceiptText },
  { tab: 'form', label: 'Form Builder', description: 'Requirements', icon: SlidersHorizontal },
  { tab: 'fraud', label: 'Fraud List', description: 'Risk controls', icon: ShieldAlert },
  { tab: 'support', label: 'Support', description: 'Feedback desk', icon: MessageSquare },
  { tab: 'vouchers', label: 'Vouchers', description: 'Discounts', icon: TicketPercent },
];

export function OwnerSidebar({ activeTab, onChangeTab, pendingApplicationsCount = 0 }: OwnerSidebarProps) {
  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-brand">
        <div className="owner-sidebar-mark">CR</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[var(--tone-text)]">CamRent PH</p>
          <p className="truncate text-[11px] font-semibold text-[var(--tone-text-muted)]">Owner Console</p>
        </div>
      </div>

      <nav className="owner-sidebar-nav" aria-label="Owner dashboard sections">
        {ownerNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.tab;
          const count = item.tab === 'applications' ? pendingApplicationsCount : 0;
          return (
            <button
              key={item.tab}
              type="button"
              className={cn('owner-nav-button', active && 'owner-nav-button-active')}
              onClick={() => onChangeTab(item.tab)}
            >
              <span className="owner-nav-icon">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold">{item.label}</span>
                <span className="hidden truncate text-[11px] font-medium opacity-70 md:block">{item.description}</span>
              </span>
              {count > 0 ? <span className="owner-nav-badge">{count}</span> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
