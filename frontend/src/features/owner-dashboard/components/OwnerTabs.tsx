import { Fragment, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Ban, ChevronRight, Download, Globe, ShieldAlert, User } from 'lucide-react';
import { PeriodCalendar } from '@/src/components/PeriodCalendar';
import { Button, Card, Input, cn } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { FraudListEntry, Item, ManualBlock, OwnerApplication, OwnerDashboardData, RentalFormField } from '@/src/types/domain';
import type { OwnerTab } from '@/src/features/owner-dashboard/types';

interface OwnerTabsProps {
  activeTab: OwnerTab;
  data: OwnerDashboardData;
  applications: OwnerApplication[];
  pieSlices: Array<{ label: string; value: number; color: string; path: string }>;
  displayApprovedDate: string | null;
  onExportOverview: () => void;
  onExportCustomers: () => void;
  onExportTransactions: () => void;
  onExportInventory: () => void;
  onExportFraud: () => void;
  onSelectApplication: (application: OwnerApplication) => void;
  onSelectReportCustomer: (customer: { renter_name: string; renter_email: string; renter_phone: string }) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReportFraud: (id: string) => void;
  onCancelBooking: (id: string) => void;
  inventory: Item[];
  categories: string[];
  categoryFilter: string;
  onChangeCategoryFilter: (value: string) => void;
  filteredInventory: Item[];
  onOpenCreateEditor: () => void;
  onOpenEditEditor: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onToggleItemAvailability: (itemId: string, value: boolean) => void;
  onOpenBlockModal: (item: Item) => void;
  calendarLoading: boolean;
  selectedCalendarItemId: string;
  onChangeSelectedCalendarItemId: (id: string) => void;
  onRefreshCalendar: () => void;
  calendarItems: Item[];
  availabilityByItem: Record<string, { bookings: Array<{ start_date: string; end_date: string; status: string }>; manualBlocks: ManualBlock[] }>;
  rentalFormFields: RentalFormField[];
  rentalFormSettings: {
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  };
  referenceImageFile: File | null;
  onReferenceImageFileChange: (file: File | null) => void;
  onRentalFormSettingsChange: (next: {
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  }) => void;
  onAddCustomField: () => void;
  onUpdateCustomField: (index: number, patch: Partial<RentalFormField>) => void;
  onRemoveCustomField: (index: number) => void;
  onSaveCustomForm: () => void;
  fraudEntries: FraudListEntry[];
  fraudAccessError: string | null;
  fraudManual: { full_name: string; email: string; contact_number: string };
  fraudScope: 'internal' | 'global';
  fraudReason: string;
  onFraudManualChange: (next: { full_name: string; email: string; contact_number: string }) => void;
  onFraudScopeChange: (value: 'internal' | 'global') => void;
  onFraudReasonChange: (value: string) => void;
  onFraudEvidenceFileChange: (file: File | null) => void;
  onSubmitManualFraud: () => void;
}

export function OwnerTabs({
  activeTab,
  data,
  applications,
  pieSlices,
  displayApprovedDate,
  onExportOverview,
  onExportCustomers,
  onExportTransactions,
  onExportInventory,
  onExportFraud,
  onSelectApplication,
  onSelectReportCustomer,
  inventory,
  categories,
  categoryFilter,
  onChangeCategoryFilter,
  filteredInventory,
  onOpenCreateEditor,
  onOpenEditEditor,
  onDeleteItem,
  onToggleItemAvailability,
  onOpenBlockModal,
  calendarLoading,
  selectedCalendarItemId,
  onChangeSelectedCalendarItemId,
  onRefreshCalendar,
  calendarItems,
  availabilityByItem,
  rentalFormFields,
  rentalFormSettings,
  referenceImageFile,
  onReferenceImageFileChange,
  onRentalFormSettingsChange,
  onAddCustomField,
  onUpdateCustomField,
  onRemoveCustomField,
  onSaveCustomForm,
  fraudEntries,
  fraudAccessError,
  fraudManual,
  fraudScope,
  fraudReason,
  onFraudManualChange,
  onFraudScopeChange,
  onFraudReasonChange,
  onFraudEvidenceFileChange,
  onSubmitManualFraud,
}: OwnerTabsProps) {
  const [expandedRequirementsKey, setExpandedRequirementsKey] = useState<string | null>(null);

  return (
    <>
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Store Overview</h1>
            <Button variant="outline" onClick={onExportOverview}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <Card className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Registered Store</p>
                <h2 className="text-2xl font-bold">{data.store?.name || 'Unnamed Store'}</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">{data.store?.description || 'No store description yet.'}</p>
                <p className="text-sm text-muted-foreground">{data.store?.address || 'No store address yet.'}</p>
                {displayApprovedDate ? <p className="text-sm text-muted-foreground">Approved Date: {format(parseISO(displayApprovedDate), 'MMM dd, yyyy')}</p> : null}
                {data.store?.status === 'approved' ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Your approved date is your due date. Monthly advance payment is recommended to avoid account inactivity.
                  </p>
                ) : null}
                {data.store?.status === 'pending' ? (
                  <p className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                    Pending stores are still being reviewed, Once approved you will receive an email notification, and your store will be visible on the platform. In the meantime, you can prepare your inventory and get ready for rentals!
                  </p>
                ) : null}
                {data.store?.status === 'pending' ? (
                  <p className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                    We are still currently working on automations of payment, However manual payment via Gcash or Bank will work as of the moment, Please message the owner of this website have your account approved or email him at mrheinrichhh@gmail.com or contact him at his number 09569749935 with your payment and your store details, thank you for your patience.
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold uppercase',
                  data.store?.status === 'approved' ? 'bg-green-100 text-green-700' : data.store?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700',
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
              <p className="text-3xl font-bold">{formatPHP(data.stats?.total_revenue || 0)}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{applications.filter((app) => app.status === 'PENDING_REVIEW').length}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Customers</p>
              <p className="text-3xl font-bold">{data.ownerAnalytics?.totalCustomers || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Total Successful Rentals</p>
              <p className="text-3xl font-bold">{data.ownerAnalytics?.totalCustomersRented || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="mb-1 text-sm text-muted-foreground">Profit (Successful Rentals)</p>
              <p className="text-3xl font-bold">{formatPHP(data.ownerAnalytics?.totalProfit || 0)}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold">Status Distribution (Pie)</h3>
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <svg viewBox="0 0 200 200" className="h-52 w-52">
                  {pieSlices.length ? pieSlices.map((slice) => <path key={slice.label} d={slice.path} fill={slice.color} />) : <circle cx="100" cy="100" r="80" fill="#e5e7eb" />}
                  <circle cx="100" cy="100" r="38" fill="white" />
                </svg>
                <div className="space-y-2 text-sm">
                  {pieSlices.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                      <span>{slice.label}</span>
                      <span className="font-semibold">{slice.value}</span>
                    </div>
                  ))}
                  {!pieSlices.length && <p className="text-muted-foreground">No status data yet.</p>}
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-bold">Peak Rental Dates (Bar)</h3>
              <div className="space-y-3">
                {(data.ownerAnalytics?.peakRentalDates || []).slice(0, 7).map((entry) => (
                  <div key={entry.date}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{entry.date}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-3 rounded bg-muted">
                      <div
                        className="h-3 rounded bg-emerald-500"
                        style={{ width: `${Math.min(100, (entry.count / Math.max(1, (data.ownerAnalytics?.peakRentalDates || [])[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!(data.ownerAnalytics?.peakRentalDates || []).length && <p className="text-sm text-muted-foreground">No peak date data yet.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Customers</h1>
            <Button variant="outline" onClick={onExportCustomers}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Customer</th>
                  <th className="p-4 text-sm font-semibold">Transactions</th>
                  <th className="p-4 text-sm font-semibold">ID Types</th>
                  <th className="p-4 text-sm font-semibold">Requirements</th>
                  <th className="p-4 text-sm font-semibold">Mostly Rented</th>
                  <th className="p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.customers || []).map((customer) => (
                  <Fragment key={customer.renter_email}>
                    <tr className="border-t align-top">
                      <td className="p-4 text-sm">
                        <p className="font-semibold">{customer.renter_name}</p>
                        <p className="text-muted-foreground">{customer.renter_email}</p>
                        <p className="text-muted-foreground">{customer.renter_phone}</p>
                      </td>
                      <td className="p-4 text-sm">{customer.transaction_count}</td>
                      <td className="p-4 text-sm">{customer.id_types.length ? customer.id_types.join(', ') : 'No IDs submitted'}</td>
                      <td className="p-4 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!(customer.requirements || []).length}
                          onClick={() =>
                            setExpandedRequirementsKey((prev) => (prev === customer.renter_email ? null : customer.renter_email))
                          }
                        >
                          {(customer.requirements || []).length ? (expandedRequirementsKey === customer.renter_email ? 'Hide Requirements' : 'View Requirements') : 'No Files'}
                        </Button>
                      </td>
                      <td className="p-4 text-sm">
                        {customer.mostly_rented_gears.length ? customer.mostly_rented_gears.map((gear) => `${gear.name} (${gear.count})`).join(', ') : 'No rentals yet'}
                      </td>
                      <td className="p-4 text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.store?.status !== 'approved'}
                          onClick={() => onSelectReportCustomer({ renter_name: customer.renter_name, renter_email: customer.renter_email, renter_phone: customer.renter_phone })}
                        >
                          Flag as Fraud
                        </Button>
                      </td>
                    </tr>
                    {expandedRequirementsKey === customer.renter_email && (
                      <tr className="border-t bg-muted/20">
                        <td className="p-4 text-sm" colSpan={6}>
                          <div className="space-y-2">
                            <p className="font-semibold">Submitted Requirements</p>
                            {(customer.requirements || []).map((requirement) => (
                              <p key={`${customer.renter_email}-${requirement.type}`}>
                                <span className="mr-2 rounded bg-muted px-2 py-0.5 text-xs font-medium">{requirement.type}</span>
                                <a className="text-primary underline" href={requirement.url} target="_blank" rel="noreferrer">
                                  Open file
                                </a>
                              </p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {!(data.customers || []).length && <p className="p-4 text-sm text-muted-foreground">No customers yet.</p>}
          </Card>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Recent Transactions</h1>
            <Button variant="outline" onClick={onExportTransactions}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Customer</th>
                  <th className="p-4 text-sm font-semibold">Amount</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-sm font-semibold">ID Types</th>
                  <th className="p-4 text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentTransactions || []).map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="p-4 text-sm">
                      <p className="font-semibold">{transaction.renter_name}</p>
                      <p className="text-muted-foreground">{transaction.renter_email}</p>
                    </td>
                    <td className="p-4 text-sm">{formatPHP(transaction.total_amount)}</td>
                    <td className="p-4 text-sm">{transaction.status.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-sm">{transaction.id_types.length ? transaction.id_types.join(', ') : 'No IDs submitted'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{format(parseISO(transaction.created_at), 'MMM dd, yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!(data.recentTransactions || []).length && <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>}
          </Card>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Rental Applications</h1>
          <div className="grid grid-cols-1 gap-4">
            {applications.map((application) => (
              <Card key={application.id} className="flex cursor-pointer items-center justify-between p-6 transition-colors hover:bg-muted/10" onClick={() => onSelectApplication(application)}>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full',
                      application.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' : application.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
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
                    <h3 className="font-bold">{application.renter_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {application.items.length} items • {formatPHP(application.total_amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold',
                      application.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' : application.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExportInventory}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
              <Button onClick={onOpenCreateEditor} className="h-10 rounded-full px-5">
                Add New Gear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button key={category} size="sm" variant={categoryFilter === category ? 'secondary' : 'outline'} onClick={() => onChangeCategoryFilter(category)}>
                {category === 'all' ? 'All Gear' : category}
              </Button>
            ))}
          </div>

          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Item</th>
                  <th className="p-4 text-sm font-semibold">Category</th>
                  <th className="p-4 text-sm font-semibold">Price</th>
                  <th className="p-4 text-sm font-semibold">Stock</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                  <th className="p-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                          <img src={item.image_url || `https://picsum.photos/seed/item-${item.id}/100/100`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{item.category}</td>
                    <td className="p-4">{formatPHP(item.daily_price)}</td>
                    <td className="p-4">{Math.max(0, item.stock || 0)}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.is_available !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        onClick={() => onToggleItemAvailability(item.id, !(item.is_available !== false))}
                        aria-label={`Toggle ${item.name} availability`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${item.is_available !== false ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">{item.is_available !== false ? 'Available' : 'Unavailable'}</p>
                    </td>
                    <td className="space-x-2 p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onOpenBlockModal(item)}>
                        Block Dates
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onOpenEditEditor(item)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteItem(item)}>
                        Delete
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Rental Calendar</h1>
            <Button variant="outline" onClick={onRefreshCalendar}>
              Refresh
            </Button>
          </div>
          <div className="max-w-sm">
            <label className="mb-2 block text-sm font-medium">Select gear</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={selectedCalendarItemId} onChange={(event) => onChangeSelectedCalendarItemId(event.target.value)}>
              <option value="all">All gear</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {calendarLoading && <p className="text-sm text-muted-foreground">Loading availability...</p>}
          <div className="space-y-4">
            {calendarItems.map((item) => {
              const availability = availabilityByItem[item.id] || { bookings: [], manualBlocks: [] };
              const unavailable = [
                ...availability.bookings.map((booking) => ({
                  key: `booking-${booking.start_date}-${booking.end_date}-${booking.status}`,
                  start: booking.start_date,
                  end: booking.end_date,
                  label: booking.status === 'ONGOING' ? 'Occupied' : 'Approved booking',
                })),
                ...availability.manualBlocks.map((block) => ({
                  key: `block-${block.id}`,
                  start: block.start_date,
                  end: block.end_date,
                  label: `Manual block${block.reason ? `: ${block.reason}` : ''}`,
                })),
              ].sort((a, b) => a.start.localeCompare(b.start));

              return (
                <Card key={item.id} className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPHP(item.daily_price)}/day</span>
                  </div>
                  <PeriodCalendar
                    periods={unavailable.map((slot) => ({
                      id: slot.key,
                      start: slot.start,
                      end: slot.end,
                      label: slot.label,
                      tone: slot.label.startsWith('Manual block') ? 'blocked' : slot.label === 'Occupied' ? 'approved' : 'pending',
                    }))}
                  />
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Rental Form Builder</h1>
              <p className="text-sm text-muted-foreground">Standard fields remain fixed. Add extra fields required by your store.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onAddCustomField}>
                Add Field
              </Button>
              <Button onClick={onSaveCustomForm}>Save Form</Button>
            </div>
          </div>
          <Card className="space-y-4 p-5">
            <div className="space-y-3 rounded-xl border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={rentalFormSettings.show_branch_map}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, show_branch_map: event.target.checked })}
                />
                Show branch map in rental agreement form
              </label>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Reference Text</label>
                <textarea
                  value={rentalFormSettings.reference_text}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, reference_text: event.target.value })}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Optional notes, instructions, reminders..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference Image (optional)</label>
                <Input type="file" accept="image/*" onChange={(event) => onReferenceImageFileChange(event.target.files?.[0] ?? null)} />
                <select
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={rentalFormSettings.reference_image_position}
                  onChange={(event) => onRentalFormSettingsChange({ ...rentalFormSettings, reference_image_position: event.target.value === 'mid' ? 'mid' : 'top' })}
                >
                  <option value="top">Show at top of rental form</option>
                  <option value="mid">Show in middle of rental form</option>
                </select>
                {(referenceImageFile || rentalFormSettings.reference_image_url) && (
                  <div className="h-28 w-40 overflow-hidden rounded-md border bg-muted/20">
                    <img src={referenceImageFile ? URL.createObjectURL(referenceImageFile) : rentalFormSettings.reference_image_url} alt="Reference" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            {rentalFormFields.length === 0 && <p className="text-sm text-muted-foreground">No custom fields yet.</p>}
            {rentalFormFields.map((field, index) => (
              <div key={`${field.id}-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-12">
                <Input className="md:col-span-3" placeholder="Field ID" value={field.id} onChange={(event) => onUpdateCustomField(index, { id: event.target.value })} />
                <Input className="md:col-span-4" placeholder="Label" value={field.label} onChange={(event) => onUpdateCustomField(index, { label: event.target.value })} />
                <select
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
                  value={field.type}
                  onChange={(event) => onUpdateCustomField(index, { type: event.target.value as RentalFormField['type'] })}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                </select>
                <Input className="md:col-span-2" placeholder="Placeholder" value={field.placeholder || ''} onChange={(event) => onUpdateCustomField(index, { placeholder: event.target.value })} />
                <div className="flex items-center gap-2 md:col-span-1">
                  <input type="checkbox" checked={field.required} onChange={(event) => onUpdateCustomField(index, { required: event.target.checked })} />
                  <span className="text-xs">Required</span>
                </div>
                {field.type === 'select' && (
                  <Input
                    className="md:col-span-10"
                    placeholder="Options (comma separated)"
                    value={(field.options || []).join(', ')}
                    onChange={(event) =>
                      onUpdateCustomField(index, {
                        options: event.target.value
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                )}
                <div className="md:col-span-2">
                  <Button variant="ghost" className="text-destructive" onClick={() => onRemoveCustomField(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Fraud List</h1>
            <Button variant="outline" onClick={onExportFraud}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
          <p className="text-muted-foreground">Add internal/global fraud entries. Global requests need admin approval.</p>
          {fraudAccessError ? (
            <Card className="p-4">
              <p className="text-sm text-amber-900">{fraudAccessError}</p>
            </Card>
          ) : (
            <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <Input placeholder="Full name" value={fraudManual.full_name} onChange={(event) => onFraudManualChange({ ...fraudManual, full_name: event.target.value })} />
              <Input placeholder="Email" value={fraudManual.email} onChange={(event) => onFraudManualChange({ ...fraudManual, email: event.target.value })} />
              <Input placeholder="Contact number" value={fraudManual.contact_number} onChange={(event) => onFraudManualChange({ ...fraudManual, contact_number: event.target.value })} />
              <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => onFraudScopeChange(event.target.value === 'global' ? 'global' : 'internal')}>
                <option value="internal">Internal</option>
                <option value="global">Global (admin approval)</option>
              </select>
              <Input placeholder="Reason" value={fraudReason} onChange={(event) => onFraudReasonChange(event.target.value)} />
              <div className="md:col-span-2">
                <Input type="file" accept="image/*" onChange={(event) => onFraudEvidenceFileChange(event.target.files?.[0] ?? null)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={onSubmitManualFraud}>Add Fraud Person</Button>
              </div>
            </Card>
          )}
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-sm font-semibold">Reported Person</th>
                  <th className="p-4 text-sm font-semibold">Contact Info</th>
                  <th className="p-4 text-sm font-semibold">Reason</th>
                  <th className="p-4 text-sm font-semibold">Scope</th>
                  <th className="p-4 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {fraudEntries.map((entry) => (
                  <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{entry.full_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{entry.email}</p>
                      <p className="text-xs text-muted-foreground">{entry.contact_number}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{entry.reason}</p>
                      {entry.evidence_image_url ? (
                        <a href={entry.evidence_image_url} target="_blank" rel="noreferrer" className="text-xs underline">
                          View evidence
                        </a>
                      ) : null}
                    </td>
                    <td className="p-4">
                      {entry.scope === 'global' ? (
                        <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                          <Globe className="h-2 w-2" /> Global
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Internal</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">{entry.status || 'approved'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </>
  );
}
