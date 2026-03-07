import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Ban, Calendar as CalendarIcon, Camera, ChevronRight, Clock, Globe, LayoutDashboard, ShieldAlert, User } from 'lucide-react';
import { api } from '@/src/lib/api';
import type { Item, OwnerApplication, OwnerDashboardData } from '@/src/types/domain';
import { Button, Card, cn } from '@/src/components/ui';

type OwnerTab = 'overview' | 'applications' | 'inventory' | 'calendar' | 'fraud';

export function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, apps, items] = await Promise.all([
        api.get<OwnerDashboardData>('/api/dashboard/owner'),
        api.get<OwnerApplication[]>('/api/owner/applications'),
        api.get<Item[]>('/api/items'),
      ]);

      console.log('[owner-dashboard] loaded', {
        stats,
        applications: apps.length,
        inventory: items.length,
      });

      setData(stats);
      setApplications(apps);
      setInventory(items);
    } catch (error: any) {
      console.error('[owner-dashboard] load failed', error);
      setError(error.message || 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const withReload = async (task: () => Promise<void>, successMessage: string) => {
    try {
      await task();
      alert(successMessage);
      loadData();
      setSelectedApp(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApprove = (id: string) => withReload(() => api.post(`/api/orders/${id}/approve`), 'Application Approved!');
  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/reject`, { reason }), 'Application Rejected');
  };
  const handleReportFraud = async (id: string) => {
    const reason = prompt('Why are you reporting this as fraud?');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/report-fraud`, { reason }), 'Reported as Fraud');
  };
  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Reason for cancellation?');
    if (!reason) return;
    await withReload(() => api.post(`/api/orders/${id}/cancel`, { reason }), 'Booking Cancelled');
  };

  if (loading) return <div className="p-12 text-center">Loading dashboard...</div>;

  if (error) {
    return (
      <div className="p-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Owner dashboard unavailable</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  if (!data || (data as any).error) {
    return (
      <div className="p-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">No store found</h1>
        <p className="text-muted-foreground">
          This owner account does not have a store record yet. Sign up again with the owner form or create a store record in the backend.
        </p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 space-y-2 border-r bg-muted/20 p-6">
        <Button variant={activeTab === 'overview' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('overview')}>
          <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
        </Button>
        <Button variant={activeTab === 'applications' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('applications')}>
          <Clock className="mr-2 h-4 w-4" /> Rental Applications
        </Button>
        <Button variant={activeTab === 'inventory' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('inventory')}>
          <Camera className="mr-2 h-4 w-4" /> Inventory
        </Button>
        <Button variant={activeTab === 'calendar' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('calendar')}>
          <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
        </Button>
        <Button variant={activeTab === 'fraud' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('fraud')}>
          <ShieldAlert className="mr-2 h-4 w-4" /> Fraud List
        </Button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Store Overview</h1>
            <Card className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Registered Store</p>
                  <h2 className="text-2xl font-bold">{data.store?.name || 'Unnamed Store'}</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">{data.store?.description || 'No store description yet.'}</p>
                  <p className="text-sm text-muted-foreground">{data.store?.address || 'No store address yet.'}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold uppercase',
                    data.store?.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : data.store?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700',
                  )}
                >
                  {data.store?.status || 'unknown'}
                </span>
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="p-6">
                <p className="mb-1 text-sm text-muted-foreground">Total Rentals</p>
                <p className="text-3xl font-bold">{data.stats?.total_rentals || 0}</p>
              </Card>
              <Card className="p-6">
                <p className="mb-1 text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">${data.stats?.total_revenue || 0}</p>
              </Card>
              <Card className="p-6">
                <p className="mb-1 text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{applications.filter((app) => app.status === 'PENDING_REVIEW').length}</p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Rental Applications</h1>
            <div className="grid grid-cols-1 gap-4">
              {applications.map((application) => (
                <Card key={application.id} className="flex cursor-pointer items-center justify-between p-6 transition-colors hover:bg-muted/10" onClick={() => setSelectedApp(application)}>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-full',
                        application.status === 'PENDING_REVIEW'
                          ? 'bg-yellow-100 text-yellow-700'
                          : application.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                      )}
                    >
                      <User className="h-6 w-6" />
                      {Boolean(application.fraud_flag) && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
                          <ShieldAlert className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{application.renter_name}</h3>
                        {Boolean(application.fraud_flag) && (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            <ShieldAlert className="h-2 w-2" /> POTENTIAL FRAUD MATCH
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {application.items.length} items • ${application.total_amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold',
                        application.status === 'PENDING_REVIEW'
                          ? 'bg-yellow-100 text-yellow-700'
                          : application.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                      )}
                    >
                      {application.status.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Inventory</h1>
              <Button>Add New Gear</Button>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Item</th>
                    <th className="p-4 text-sm font-semibold">Category</th>
                    <th className="p-4 text-sm font-semibold">Daily Price</th>
                    <th className="p-4 text-sm font-semibold">Status</th>
                    <th className="p-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-t transition-colors hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                            <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/100/100`} alt="" className="h-full w-full object-cover" />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{item.category}</td>
                      <td className="p-4 text-sm font-medium">${item.daily_price}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">Available</span>
                      </td>
                      <td className="space-x-2 p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const start = prompt('Start Date (YYYY-MM-DD):');
                            const end = prompt('End Date (YYYY-MM-DD):');
                            const reason = prompt('Reason for block:');
                            if (!start || !end) return;
                            api.post('/api/manual-blocks', { item_id: item.id, start_date: start, end_date: end, reason }).then(loadData);
                          }}
                        >
                          Block Dates
                        </Button>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Rental Calendar</h1>
            <Card className="flex h-[600px] flex-col items-center justify-center p-8 text-center">
              <CalendarIcon className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-bold">Calendar View Coming Soon</h3>
              <p className="max-w-md text-muted-foreground">
                We are integrating a full-featured calendar to help you visualize all pending and approved bookings in one place.
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'fraud' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Fraud List</h1>
            <p className="text-muted-foreground">Individuals reported for fraudulent activities in your store or globally.</p>
            <Card className="overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-sm font-semibold">Reported Person</th>
                    <th className="p-4 text-sm font-semibold">Contact Info</th>
                    <th className="p-4 text-sm font-semibold">Reason</th>
                    <th className="p-4 text-sm font-semibold">Scope</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">John Doe</p>
                      <p className="text-xs text-muted-foreground">123 Fake St, Manila</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">john@example.com</p>
                      <p className="text-xs text-muted-foreground">09123456789</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">Multiple late returns and damaged gear</p>
                    </td>
                    <td className="p-4">
                      <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        <Globe className="h-2 w-2" /> Global
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}

        <AnimatePresence>
          {selectedApp && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-8 shadow-2xl"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="mb-1 text-2xl font-bold">Application Details</h2>
                    <p className="text-muted-foreground">
                      Order #{selectedApp.id} • Submitted {format(parseISO(selectedApp.created_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedApp(null)}>
                    &times;
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                  <div className="space-y-8">
                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name</span> <span>{selectedApp.renter_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span> <span>{selectedApp.renter_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span> <span>{selectedApp.renter_phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address</span> <span className="max-w-[200px] text-right">{selectedApp.renter_address}</span>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistics & Payment</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Mode</span> <span className="capitalize">{selectedApp.delivery_mode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Mode</span> <span className="capitalize">{selectedApp.payment_mode}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                          <span>Total Amount</span> <span>${selectedApp.total_amount}</span>
                        </div>
                      </div>
                    </section>

                    {selectedApp.status === 'PENDING_REVIEW' && (
                      <div className="space-y-4 pt-4">
                        {Boolean(selectedApp.fraud_flag) && (
                          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
                            <div>
                              <p className="text-sm font-bold text-red-700">Potential Fraud Match Detected</p>
                              <p className="text-xs text-red-600">This customer matches an entry in the fraud list. Please verify documents carefully before approving.</p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-4">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedApp.id)}>
                            Approve Rental
                          </Button>
                          <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedApp.id)}>
                            Reject
                          </Button>
                        </div>
                        <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleReportFraud(selectedApp.id)}>
                          <ShieldAlert className="mr-2 h-4 w-4" /> Report as Fraud
                        </Button>
                      </div>
                    )}

                    {selectedApp.status === 'APPROVED' && (
                      <div className="pt-4">
                        <Button variant="outline" className="w-full text-red-600" onClick={() => handleCancelBooking(selectedApp.id)}>
                          <Ban className="mr-2 h-4 w-4" /> Cancel Approved Booking
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Verification Documents</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {['ID Front', 'ID Back', 'Selfie w/ ID', 'Proof of Billing'].map((label, index) => (
                          <div key={label} className="space-y-2">
                            <p className="text-xs font-medium">{label}</p>
                            <div className="aspect-video cursor-zoom-in overflow-hidden rounded-lg border bg-muted hover:opacity-90">
                              <img src={`https://picsum.photos/seed/doc-${index}-${selectedApp.id}/400/300`} alt="" referrerPolicy="no-referrer" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Rented Items</h4>
                      <div className="space-y-2">
                        {selectedApp.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.start_date} to {item.end_date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
