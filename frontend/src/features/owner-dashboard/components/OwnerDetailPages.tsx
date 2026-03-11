import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Ban, CalendarDays, Download, ExternalLink, FileText, Package, ShieldAlert } from 'lucide-react';
import { Button, Input } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import type { Item, OwnerApplication } from '@/src/types/domain';
import type { ItemEditor, OwnerTab } from '@/src/features/owner-dashboard/types';

type DetailView = 'none' | 'edit-gear' | 'block-dates' | 'report-fraud' | 'application-details';

interface OwnerDetailPagesProps {
  view: DetailView;
  onBack: (tab?: OwnerTab) => void;
  editor: ItemEditor;
  editorImageFile: File | null;
  editorSaving: boolean;
  onEditorChange: (next: ItemEditor) => void;
  onEditorImageFileChange: (file: File | null) => void;
  onSaveEditor: () => void;
  blockModalItem: Item | null;
  blockStartDate: string;
  blockEndDate: string;
  blockReason: string;
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
  onFraudRequirementFilesChange: (files: File[]) => void;
  onSubmitCustomerFraud: () => void;
  selectedApp: OwnerApplication | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReportFraud: (id: string) => void;
  onCancelBooking: (id: string) => void;
}

export function OwnerDetailPages({
  view,
  onBack,
  editor,
  editorImageFile,
  editorSaving,
  onEditorChange,
  onEditorImageFileChange,
  onSaveEditor,
  blockModalItem,
  blockStartDate,
  blockEndDate,
  blockReason,
  onBlockStartDateChange,
  onBlockEndDateChange,
  onBlockReasonChange,
  onSubmitBlockDates,
  reportCustomer,
  fraudScope,
  fraudReason,
  onFraudScopeChange,
  onFraudReasonChange,
  onFraudRequirementFilesChange,
  onSubmitCustomerFraud,
  selectedApp,
  onApprove,
  onReject,
  onReportFraud,
  onCancelBooking,
}: OwnerDetailPagesProps) {
  const [fileLoading, setFileLoading] = useState(false);
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

  const resolveFileAccess = async (url: string) => {
    const result = await api.get<{ view_url: string; download_url: string; request_id?: string }>(`/api/upload/public/access?url=${encodeURIComponent(url)}`);
    console.log('[owner/file] access resolved', { sourceUrl: url, viewUrl: result.view_url, downloadUrl: result.download_url, requestId: result.request_id });
    return result;
  };

  const openFile = async (url: string) => {
    try {
      setFileLoading(true);
      const access = await resolveFileAccess(url);
      window.open(access.view_url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      alert(error?.message || 'Unable to view file.');
    } finally {
      setFileLoading(false);
    }
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

  if (view === 'none') return null;

  if (view === 'edit-gear') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{editor.id ? 'Edit Gear' : 'Add New Gear'}</h2>
            <p className="text-sm text-muted-foreground">Update inventory without using a modal.</p>
          </div>
          <Button variant="outline" onClick={() => onBack('inventory')}>
            Back to Inventory
          </Button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
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
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <FileUpload
              label="Gear Photo"
              accept="image/*"
              file={editorImageFile}
              onChange={(files) => onEditorImageFileChange(files?.[0] ?? null)}
              helperText="Upload a new photo. If empty, existing image is kept."
            />
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
            className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          />
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => onBack('inventory')}>
              Cancel
            </Button>
            <Button className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800" onClick={onSaveEditor} disabled={editorSaving}>
              {editorSaving ? 'Saving...' : editor.id ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'block-dates') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Block Dates</h2>
            <p className="text-sm text-muted-foreground">{blockModalItem?.name || 'Select an item first.'}</p>
          </div>
          <Button variant="outline" onClick={() => onBack('inventory')}>
            Back to Inventory
          </Button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
              <Button variant="outline" onClick={() => onBack('inventory')}>
                Cancel
              </Button>
              <Button onClick={onSubmitBlockDates}>Block Dates</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'report-fraud') {
    if (!reportCustomer) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Flag Customer as Fraud</h2>
          <p className="text-sm text-muted-foreground">No customer selected.</p>
          <Button variant="outline" onClick={() => onBack('customers')}>
            Back to Customers
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Flag Customer as Fraud</h2>
            <p className="text-sm text-muted-foreground">
              {reportCustomer?.renter_name} ({reportCustomer?.renter_email})
            </p>
          </div>
          <Button variant="outline" onClick={() => onBack('customers')}>
            Back to Customers
          </Button>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={fraudScope} onChange={(event) => onFraudScopeChange(event.target.value === 'global' ? 'global' : 'internal')}>
              <option value="internal">Internal</option>
              <option value="global">Global (admin approval)</option>
            </select>
            <Input placeholder="Reason" value={fraudReason} onChange={(event) => onFraudReasonChange(event.target.value)} />
            <FileUpload
              label="Fraud Evidence (optional)"
              accept=".pdf,image/*"
              multiple
              onChange={(files) => onFraudRequirementFilesChange(Array.from(files || []))}
              helperText="Optional requirements: upload up to 5 image/PDF files."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onBack('customers')}>
                Cancel
              </Button>
              <Button onClick={onSubmitCustomerFraud}>Submit</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'application-details') {
    if (!selectedApp) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Application Details</h2>
          <p className="text-sm text-muted-foreground">No application selected.</p>
          <Button variant="outline" onClick={() => onBack('applications')}>
            Back to Applications
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Application Details</h2>
            <p className="text-xs text-slate-600">Order #{selectedApp.id} • Submitted {format(parseISO(selectedApp.created_at), 'MMM dd, yyyy hh:mm a')}</p>
          </div>
          <Button variant="outline" onClick={() => onBack('applications')}>
            Back to Applications
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
              <div className="space-y-4">
                {Boolean(selectedApp.fraud_flag) && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Potential Fraud Match Detected</p>
                      <p className="text-xs text-red-600">This person matches records in our fraud list (internal/global). Verify documents before approval.</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
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
              <div>
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
                      <div>
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(selectedApp.documents || []).map((doc) => {
                  const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(doc.url);
                  return (
                    <div key={`${doc.type}-${doc.url}`} className="rounded-xl border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">{doc.type}</p>
                      {isImage ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="block h-36 w-full overflow-hidden rounded-lg border">
                          <img src={doc.url} alt={doc.type} className="h-full w-full object-cover" />
                        </a>
                      ) : (
                        <div className="flex h-36 flex-col items-center justify-center rounded-lg border bg-white text-center">
                          <FileText className="mb-1 h-5 w-5 text-slate-600" />
                          <span className="px-1 text-xs font-semibold text-slate-700">{doc.type}</span>
                        </div>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => (isImage ? window.open(doc.url, '_blank', 'noopener,noreferrer') : openFile(doc.url))} className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold" disabled={fileLoading}>
                          <ExternalLink className="mr-1 h-3 w-3" /> View
                        </button>
                        <button type="button" onClick={() => downloadFile(doc.url, `${doc.type}.pdf`)} className="flex items-center justify-center rounded border px-2 py-1.5 text-xs font-semibold" disabled={fileLoading}>
                          <Download className="mr-1 h-3 w-3" /> Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!(selectedApp.documents || []).length && <p className="text-xs text-muted-foreground">No requirement files uploaded.</p>}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
