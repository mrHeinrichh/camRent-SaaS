import { Calendar as CalendarIcon, Camera, Clock, LayoutDashboard, MessageSquare, ReceiptText, ShieldAlert, Users } from 'lucide-react';
import { Button } from '@/src/components/ui';
import type { OwnerTab } from '@/src/features/owner-dashboard/types';

interface OwnerSidebarProps {
  activeTab: OwnerTab;
  onChangeTab: (tab: OwnerTab) => void;
}

export function OwnerSidebar({ activeTab, onChangeTab }: OwnerSidebarProps) {
  return (
    <aside className="w-64 space-y-2 border-r bg-gradient-to-b from-slate-100 to-cyan-50/70 p-6">
      <Button
        variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'overview' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('overview')}
      >
        <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
      </Button>
      <Button
        variant={activeTab === 'applications' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'applications' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('applications')}
      >
        <Clock className="mr-2 h-4 w-4" /> Rental Applications
      </Button>
      <Button
        variant={activeTab === 'inventory' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'inventory' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('inventory')}
      >
        <Camera className="mr-2 h-4 w-4" /> Inventory
      </Button>
      <Button
        variant={activeTab === 'calendar' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'calendar' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('calendar')}
      >
        <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
      </Button>
      <Button
        variant={activeTab === 'customers' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'customers' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('customers')}
      >
        <Users className="mr-2 h-4 w-4" /> Customers
      </Button>
      <Button
        variant={activeTab === 'transactions' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'transactions' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('transactions')}
      >
        <ReceiptText className="mr-2 h-4 w-4" /> Transactions
      </Button>
      <Button
        variant={activeTab === 'form' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'form' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('form')}
      >
        <LayoutDashboard className="mr-2 h-4 w-4" /> Form Builder
      </Button>
      <Button
        variant={activeTab === 'fraud' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'fraud' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('fraud')}
      >
        <ShieldAlert className="mr-2 h-4 w-4" /> Fraud List
      </Button>
      <Button
        variant={activeTab === 'support' ? 'secondary' : 'ghost'}
        className={`w-full justify-start transition-all ${activeTab === 'support' ? 'bg-cyan-600 text-white hover:bg-cyan-600' : 'hover:bg-cyan-100'}`}
        onClick={() => onChangeTab('support')}
      >
        <MessageSquare className="mr-2 h-4 w-4" /> Support & Feedback
      </Button>
    </aside>
  );
}
