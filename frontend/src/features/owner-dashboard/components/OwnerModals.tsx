import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Ban, CalendarDays, Download, ExternalLink, FileText, Package, ShieldAlert } from 'lucide-react';
import { Button, Input } from '@/src/components/ui';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import type { Item, OwnerApplication } from '@/src/types/domain';
import type { ItemEditor } from '@/src/features/owner-dashboard/types';
import { useState } from 'react';

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
  reportCustomer: {
    renter_name: string;
    renter_email: string;
    renter_phone: string;
    requirements?: Array<{ type: string; url: string }>;
  } | null;
  fraudScope: 'internal' | 'global';
  fraudReason: string;
  onFraudScopeChange: (value: 'internal' | 'global') => void;
  onFraudReasonChange: (value: string) => void;
  onFraudEvidenceFileChange: (file: File | null) => void;
  onFraudRequirementFilesChange: (files: File[]) => void;
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
  onFraudRequirementFilesChange,
  onCloseReportCustomer,
  onSubmitCustomerFraud,
  selectedApp,
  onCloseSelectedApp,
  onApprove,
  onReject,
  onReportFraud,
  onCancelBooking,
}: OwnerModalsProps) {
  const PRESET_BRANDS = [
    'Canon',
    'Nikon',
    'Sony',
    'Fujifilm',
    'Panasonic',
    'Olympus',
    'OM System',
    'Leica',
    'Pentax',
    'Hasselblad',
    'Phase One',
    'Ricoh',
    'Kodak',
    'Polaroid',
    'GoPro',
    'DJI',
    'Blackmagic',
    'RED',
    'ARRI',
    'Z CAM',
    'Insta360',
    'YI',
    'Sigma',
    'Tamron',
    'Tokina',
    'Samyang',
    'Rokinon',
    'Viltrox',
    'Laowa',
    'Zeiss',
    'Voigtlander',
    'Meike',
    'TTArtisan',
    '7Artisans',
    'Mitakon',
    'Others',
  ] as const;
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string; sourceUrl: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const resolveFileAccess = async (url: string) => {
    const result = await api.get<{ view_url: string; download_url: string; request_id?: string }>(`/api/upload/public/access?url=${encodeURIComponent(url)}`);
    console.log('[owner/file] access resolved', { sourceUrl: url, viewUrl: result.view_url, downloadUrl: result.download_url, requestId: result.request_id });
    return result;
  };
  const downloadFile = async (url: string, fallbackName: string) => {
    try {
      setFileLoading(true);
      const access = await resolveFileAccess(url);
      const response = await fetch(access.download_url);
      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          detail = body?.detail || body?.error || '';
          console.error('[owner/file] download failed', { status: response.status, detail, requestId: body?.request_id, sourceUrl: url });
        } catch {
          // ignore
        }
        throw new Error(`Download failed (${response.status})${detail ? `: ${detail}` : ''}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fallbackName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      alert(error?.message || 'Unable to download file.');
    } finally {
      setFileLoading(false);
    }
  };
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
                <Button variant="outline" size="icon" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100" onClick={onCloseEditor}>
                  &times;
                </Button>
              </div>
              <div className="space-y-4 px-6 pb-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Gear name" value={editor.name} onChange={(event) => onEditorChange({ ...editor, name: event.target.value })} />
                  <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Category (Camera, Lens, Audio, etc.)" value={editor.category} onChange={(event) => onEditorChange({ ...editor, category: event.target.value })} />
                  <Input
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500"
                    list="gear-brand-options"
                    placeholder="Brand (choose or type custom)"
                    value={editor.brand}
                    onChange={(event) => onEditorChange({ ...editor, brand: event.target.value })}
                  />
                  <datalist id="gear-brand-options">
                    {PRESET_BRANDS.map((brand) => (
                      <option key={brand} value={brand} />
                    ))}
                  </datalist>
                  <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Daily price" type="number" value={editor.daily_price} onChange={(event) => onEditorChange({ ...editor, daily_price: event.target.value })} />
                  <Input className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500" placeholder="Stock" type="number" min="0" value={editor.stock} onChange={(event) => onEditorChange({ ...editor, stock: event.target.value })} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                  <span className="font-medium">Availability</span>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editor.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    onClick={() => onEditorChange({ ...editor, is_available: !editor.is_available })}
                    aria-label="Toggle availability"
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${editor.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl">
              <h3 className="mb-3 text-lg font-bold text-slate-900">Block Dates - {blockModalItem.name}</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                  <Input className="border-slate-200 bg-slate-50 text-slate-900" type="date" value={blockStartDate} onChange={(event) => onBlockStartDateChange(event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                  <Input className="border-slate-200 bg-slate-50 text-slate-900" type="date" value={blockEndDate} onChange={(event) => onBlockEndDateChange(event.target.value)} min={blockStartDate || undefined} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Reason (optional)</label>
                  <Input className="border-slate-200 bg-slate-50 text-slate-900" value={blockReason} onChange={(event) => onBlockReasonChange(event.target.value)} />
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
                <Input type="file" accept=".pdf,image/*" multiple onChange={(event) => onFraudRequirementFilesChange(Array.from(event.target.files || []))} />
                <p className="text-xs text-muted-foreground">Requirements: upload up to 5 image/PDF files.</p>
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
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-2xl font-bold">Application Details</h2>
                  <p className="text-sm text-slate-600">Order #{selectedApp.id} • Submitted {format(parseISO(selectedApp.created_at), 'MMM dd, yyyy hh:mm a')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onCloseSelectedApp}>
                  &times;
                </Button>
              </div>
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                <div className="space-y-8">
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                        <span className="text-muted-foreground">Present Address</span>
                        <span className="max-w-[220px] text-right">{selectedApp.renter_address || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Emergency Contact</span>
                        <span className="max-w-[220px] text-right">
                          {selectedApp.renter_emergency_contact_name || '-'} {selectedApp.renter_emergency_contact ? `(${selectedApp.renter_emergency_contact})` : ''}
                        </span>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Logistics & Payment</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Mode</span> <span className="capitalize">{selectedApp.delivery_mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Address</span> <span className="max-w-[220px] text-right">{(selectedApp as any).delivery_address || '-'}</span>
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
                            <p className="text-xs text-red-600">This person matches records in our fraud list (internal/global). Verify documents before approval.</p>
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
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Rented Items</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedApp.items.map((item) => (
                        <div key={item.id} className="rounded-xl border bg-white p-3">
                          <div className="grid grid-cols-[4rem,1fr] gap-3">
                          <div className="h-90 w-90 overflow-hidden rounded border bg-muted">
                            <img src={item.image_url || `https://picsum.photos/seed/app-item-${item.id}/120/120`} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p> : null}
                            <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                              <p className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Quantity: {item.quantity || 1}</p>
                              <p className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Start Rent: {format(parseISO(item.start_date), 'MMM dd, yyyy')}</p>
                              <p className="inline-flex items-center gap-1 sm:col-span-2"><CalendarDays className="h-3.5 w-3.5" /> End Rent: {format(parseISO(item.end_date), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Submitted Requirements</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2">
                      {(selectedApp.documents || []).map((doc) => {
                        const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(doc.url);
                        return (
                          <div key={`${doc.type}-${doc.url}`} className="rounded-xl border bg-muted/20 p-3">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">{doc.type}</p>
                            {isImage ? (
                              <div className="space-y-2">
                                <button type="button" className="block h-36 w-full overflow-hidden rounded-lg border" onClick={() => setPreviewImageUrl(doc.url)}>
                                  <img src={doc.url} alt={doc.type} className="h-full w-full object-cover" />
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold">
                                    <ExternalLink className="mr-1 h-3 w-3" /> View
                                  </a>
                                  <a href={doc.url} download className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold">
                                    <Download className="mr-1 h-3 w-3" /> Download
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-36 flex-col items-center justify-center rounded-lg border bg-white text-center">
                                <FileText className="mb-1 h-5 w-5 text-slate-600" />
                                <span className="px-1 text-xs font-semibold text-slate-700">{doc.type}</span>
                              </div>
                            )}
                            {!isImage && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      setFileLoading(true);
                                      const access = await resolveFileAccess(doc.url);
                                      setPreviewFile({ url: access.view_url, type: doc.type, sourceUrl: doc.url });
                                    } catch (error: any) {
                                      alert(error?.message || 'Unable to view file.');
                                    } finally {
                                      setFileLoading(false);
                                    }
                                  }}
                                  className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold"
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> View
                                </button>
                                  <button type="button" onClick={() => downloadFile(doc.url, `${doc.type}.pdf`)} className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold">
                                  <Download className="mr-1 h-3 w-3" /> Download
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!(selectedApp.documents || []).length && <p className="text-xs text-muted-foreground">No requirement files uploaded.</p>}
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewFile(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white p-3" onClick={(event) => event.stopPropagation()}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{previewFile.type}</p>
                <div className="flex items-center gap-2">
                  <a href={previewFile.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border px-2 py-1 text-xs font-semibold">
                    <ExternalLink className="mr-1 h-3 w-3" /> Open
                  </a>
                  <button type="button" onClick={() => downloadFile(previewFile.sourceUrl, `${previewFile.type}.pdf`)} className="inline-flex items-center rounded border px-2 py-1 text-xs font-semibold" disabled={fileLoading}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </button>
                </div>
              </div>
              <iframe title={previewFile.type} src={previewFile.url} className="h-[82vh] w-full rounded border" />
              <p className="mt-2 text-xs text-muted-foreground">If preview fails, click Open.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImageUrl && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImageUrl(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="max-h-[90vh] max-w-6xl overflow-auto rounded-xl bg-background p-3" onClick={(event) => event.stopPropagation()}>
              <img src={previewImageUrl} alt="Zoom preview" className="h-auto max-h-[85vh] w-auto max-w-full object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {fileLoading && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-900">Preparing file...</div>
        </div>
      )}
    </>
  );
}
