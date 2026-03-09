import { Calendar as CalendarIcon, Camera, Clock, LayoutDashboard, MessageSquare, ReceiptText, ShieldAlert, TicketPercent, Users } from 'lucide-react';
import { Button } from '@/src/components/ui';
import type { OwnerTab } from '@/src/features/owner-dashboard/types';

interface OwnerSidebarProps {
  activeTab: OwnerTab;
  onChangeTab: (tab: OwnerTab) => void;
  pendingApplicationsCount?: number;
}

export function OwnerSidebar({ activeTab, onChangeTab, pendingApplicationsCount = 0 }: OwnerSidebarProps) {
  return (
    <aside className="w-full border-b bg-gradient-to-b from-slate-100 to-cyan-50/70 p-3 md:w-64 md:space-y-2 md:border-b-0 md:border-r md:p-6">
      <div className="flex gap-2 overflow-x-auto md:block md:space-y-2">
        <Button
          variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'overview' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('overview')}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
        </Button>
        <Button
          variant={activeTab === 'applications' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'applications' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('applications')}
        >
          <Clock className="mr-2 h-4 w-4" /> Rental Applications
          {pendingApplicationsCount > 0 ? (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === 'applications' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'}`}>
              {pendingApplicationsCount}
            </span>
          ) : null}
        </Button>
        <Button
          variant={activeTab === 'inventory' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'inventory' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('inventory')}
        >
          <Camera className="mr-2 h-4 w-4" /> Inventory
        </Button>
        <Button
          variant={activeTab === 'calendar' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'calendar' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('calendar')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
        </Button>
        <Button
          variant={activeTab === 'customers' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'customers' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('customers')}
        >
          <Users className="mr-2 h-4 w-4" /> Customers
        </Button>
        <Button
          variant={activeTab === 'transactions' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'transactions' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('transactions')}
        >
          <ReceiptText className="mr-2 h-4 w-4" /> Transactions
        </Button>
        <Button
          variant={activeTab === 'form' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'form' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('form')}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" /> Form Builder
        </Button>
        <Button
          variant={activeTab === 'fraud' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'fraud' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('fraud')}
        >
          <ShieldAlert className="mr-2 h-4 w-4" /> Fraud List
        </Button>
        <Button
          variant={activeTab === 'support' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'support' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('support')}
        >
          <MessageSquare className="mr-2 h-4 w-4" /> Support & Feedback
        </Button>
        <Button
          variant={activeTab === 'vouchers' ? 'secondary' : 'ghost'}
          className={`shrink-0 justify-start transition-all md:w-full ${activeTab === 'vouchers' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
          onClick={() => onChangeTab('vouchers')}
        >
          <TicketPercent className="mr-2 h-4 w-4" /> Vouchers
        </Button>
      </div>
    </aside>
  );
}
