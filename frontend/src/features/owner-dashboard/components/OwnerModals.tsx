import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Ban, ShieldAlert } from 'lucide-react';
import { Button, Input } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { Item, OwnerApplication } from '@/src/types/domain';
import type { ItemEditor } from '@/src/features/owner-dashboard/types';

interface OwnerModalsProps {
  editingOpen: boolean;
  editor: ItemEditor;
  editorImageFile: File | null;
  editorSaving: boolean;
  onCloseEditor: () => void;
  onEditorChange: (next: ItemEditor) => void;
  onEditorImageFileChange: (file: File | null) => void;
  onSaveEditor: () => void;
  blockModalItem: Item | null;
  blockStartDate: string;
  blockEndDate: string;
  blockReason: string;
  onCloseBlockModal: () => void;
  onBlockStartDateChange: (value: string) => void;
  onBlockEndDateChange: (value: string) => void;
  onBlockReasonChange: (value: string) => void;
  onSubmitBlockDates: () => void;
  reportCustomer: { renter_name: string; renter_email: string; renter_phone: string } | null;
  fraudScope: 'internal' | 'global';
  fraudReason: string;
  onFraudScopeChange: (value: 'internal' | 'global') => void;
  onFraudReasonChange: (value: string) => void;
  onFraudEvidenceFileChange: (file: File | null) => void;
  onCloseReportCustomer: () => void;
  onSubmitCustomerFraud: () => void;
  selectedApp: OwnerApplication | null;
  onCloseSelectedApp: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReportFraud: (id: string) => void;
  onCancelBooking: (id: string) => void;
}

export function OwnerModals({
  editingOpen,
  editor,
  editorImageFile,
  editorSaving,
  onCloseEditor,
  onEditorChange,
  onEditorImageFileChange,
  onSaveEditor,
  blockModalItem,
  blockStartDate,
  blockEndDate,
  blockReason,
  onCloseBlockModal,
  onBlockStartDateChange,
  onBlockEndDateChange,
  onBlockReasonChange,
  onSubmitBlockDates,
  reportCustomer,
  fraudScope,
  fraudReason,
  onFraudScopeChange,
  onFraudReasonChange,
  onFraudEvidenceFileChange,
  onCloseReportCustomer,
  onSubmitCustomerFraud,
  selectedApp,
  onCloseSelectedApp,
  onApprove,
  onReject,
  onReportFraud,
  onCancelBooking,
}: OwnerModalsProps) {
  return (
    <>
      <AnimatePresence>
        {editingOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
              <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
                <h2 className="text-2xl font-bold">{editor.id ? 'Edit Gear' : 'Add New Gear'}</h2>
                <p className="mt-1 text-sm text-slate-200">Create clean, complete inventory details for renters.</p>
              </div>
              <div className="mb-4 flex items-center justify-between px-6 pt-4">
                <Button variant="ghost" size="icon" onClick={onCloseEditor}>
                  &times;
                </Button>
              </div>
              <div className="space-y-4 px-6 pb-6">
                <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Gear name" value={editor.name} onChange={(event) => onEditorChange({ ...editor, name: event.target.value })} />
                <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Category (Camera, Lens, Audio, etc.)" value={editor.category} onChange={(event) => onEditorChange({ ...editor, category: event.target.value })} />
                <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Daily price" type="number" value={editor.daily_price} onChange={(event) => onEditorChange({ ...editor, daily_price: event.target.value })} />
                <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Stock" type="number" min="0" value={editor.stock} onChange={(event) => onEditorChange({ ...editor, stock: event.target.value })} />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                  <input type="checkbox" checked={editor.is_available} onChange={(event) => onEditorChange({ ...editor, is_available: event.target.checked })} />
                  Available for renting
                </label>
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Gear Photo</p>
                  <Input className="border-slate-200 bg-white text-slate-900 file:text-slate-700" type="file" accept="image/*" onChange={(event) => onEditorImageFileChange(event.target.files?.[0] ?? null)} />
                  <p className="text-xs text-slate-500">Upload a new photo. If empty, existing image is kept.</p>
                  {(editorImageFile || editor.image_url) && (
                    <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img src={editorImageFile ? URL.createObjectURL(editorImageFile) : editor.image_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Description"
                  value={editor.description}
                  onChange={(event) => onEditorChange({ ...editor, description: event.target.value })}
                  className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                />
              </div>
              <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <Button variant="outline" onClick={onCloseEditor}>
                  Cancel
                </Button>
                <Button className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800" onClick={onSaveEditor} disabled={editorSaving}>
                  {editorSaving ? 'Saving...' : editor.id ? 'Save Changes' : 'Create Item'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blockModalItem && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl">
              <h3 className="mb-3 text-lg font-bold">Block Dates - {blockModalItem.name}</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Start Date</label>
                  <Input type="date" value={blockStartDate} onChange={(event) => onBlockStartDateChange(event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">End Date</label>
                  <Input type="date" value={blockEndDate} onChange={(event) => onBlockEndDateChange(event.target.value)} min={blockStartDate || undefined} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
                  <Input value={blockReason} onChange={(event) => onBlockReasonChange(event.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onCloseBlockModal}>
                    Cancel
                  </Button>
                  <Button onClick={onSubmitBlockDates}>Block Dates</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportCustomer && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg rounded-xl bg-background p-5 shadow-xl">
              <h3 className="mb-1 text-lg font-bold">Flag Customer as Fraud</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {reportCustomer.renter_name} ({reportCustomer.renter_email})
              </p>
              <div className="space-y-3">
                <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => onFraudScopeChange(event.target.value === 'global' ? 'global' : 'internal')}>
                  <option value="internal">Internal</option>
                  <option value="global">Global (admin approval)</option>
                </select>
                <Input placeholder="Reason" value={fraudReason} onChange={(event) => onFraudReasonChange(event.target.value)} />
                <Input type="file" accept="image/*" onChange={(event) => onFraudEvidenceFileChange(event.target.files?.[0] ?? null)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onCloseReportCustomer}>
                    Cancel
                  </Button>
                  <Button onClick={onSubmitCustomerFraud}>Submit</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-8 shadow-2xl">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-2xl font-bold">Application Details</h2>
                  <p className="text-muted-foreground">Order #{selectedApp.id} • Submitted {format(parseISO(selectedApp.created_at), 'MMM dd, HH:mm')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onCloseSelectedApp}>
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
                        <span className="text-muted-foreground">Billing Address</span>
                        {String(selectedApp.renter_address || '').startsWith('http') ? (
                          <a className="max-w-[220px] text-right text-primary underline" href={selectedApp.renter_address} target="_blank" rel="noreferrer">
                            Open file
                          </a>
                        ) : (
                          <span className="max-w-[200px] text-right">{selectedApp.renter_address}</span>
                        )}
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
                        <span>Total Amount</span> <span>{formatPHP(selectedApp.total_amount)}</span>
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
                            <p className="text-xs text-red-600">This customer matches an entry in the fraud list. Verify documents before approval.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onApprove(selectedApp.id)}>
                          Approve Rental
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => onReject(selectedApp.id)}>
                          Reject
                        </Button>
                      </div>
                      <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onReportFraud(selectedApp.id)}>
                        <ShieldAlert className="mr-2 h-4 w-4" /> Report as Fraud
                      </Button>
                    </div>
                  )}
                  {selectedApp.status === 'APPROVED' && (
                    <div className="pt-4">
                      <Button variant="outline" className="w-full text-red-600" onClick={() => onCancelBooking(selectedApp.id)}>
                        <Ban className="mr-2 h-4 w-4" /> Cancel Approved Booking
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-8">
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
    </>
  );
}
