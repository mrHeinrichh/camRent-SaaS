import { Download, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';

interface DonationQrInput {
  label: string;
  url: string;
  file: File | null;
}

interface DonationBankInput {
  label: string;
  url: string;
  file: File | null;
}

interface DonationsTabProps {
  form: {
    message: string;
    is_active: boolean;
    qr_codes: DonationQrInput[];
    bank_details: DonationBankInput[];
  };
  saving: boolean;
  onChange: (next: Partial<DonationsTabProps['form']>) => void;
  onSave: () => Promise<void>;
  onExport: () => void;
  validationErrors?: Record<string, string>;
  clearValidationError?: (field: string) => void;
}

export function DonationsTab({
  form,
  saving,
  onChange,
  onSave,
  onExport,
  validationErrors = {},
  clearValidationError,
}: DonationsTabProps) {
  const updateQr = (index: number, patch: Partial<DonationQrInput>) => {
    onChange({
      qr_codes: form.qr_codes.map((entry, current) => (current === index ? { ...entry, ...patch } : entry)),
    });
  };
  const removeQr = (index: number) => onChange({ qr_codes: form.qr_codes.filter((_, current) => current !== index) });
  const addQr = () => onChange({ qr_codes: [...form.qr_codes, { label: '', url: '', file: null }] });

  const updateBank = (index: number, patch: Partial<DonationBankInput>) => {
    onChange({
      bank_details: form.bank_details.map((entry, current) => (current === index ? { ...entry, ...patch } : entry)),
    });
  };
  const removeBank = (index: number) => onChange({ bank_details: form.bank_details.filter((_, current) => current !== index) });
  const addBank = () => onChange({ bank_details: [...form.bank_details, { label: '', url: '', file: null }] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Donation Settings</h1>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] ml-1">Support Page Message</p>
        <textarea
          className={`min-h-24 w-full rounded-xl border px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            validationErrors.donMsg ? 'border-red-500' : 'border-[var(--tone-border)] bg-[var(--tone-surface-soft)]'
          }`}
          value={form.message}
          onChange={(event) => {
            onChange({ message: event.target.value });
            clearValidationError?.('donMsg');
          }}
          placeholder="Support this website by donating funds for its maintenance. Any amount will be appreciated."
        />
        {validationErrors.donMsg && <p className="mt-1.5 ml-1 text-xs font-bold text-red-500">{validationErrors.donMsg}</p>}
        
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer pt-1">
          <input type="checkbox" checked={form.is_active} onChange={(event) => onChange({ is_active: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="font-medium">Active (Visible on Support Page)</span>
        </label>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] ml-1">QR Codes</p>
          <Button type="button" variant="outline" size="sm" onClick={addQr} className="rounded-xl h-8">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add QR
          </Button>
        </div>
        <div className="space-y-4">
          {form.qr_codes.map((entry, index) => (
            <div key={`donation-qr-${index}`} className="space-y-3 rounded-2xl border border-[var(--tone-border)] p-4 bg-[var(--tone-surface-soft)]/30">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,1fr,auto] items-end">
                <Input label="Label" placeholder="e.g. GCash" value={entry.label} onChange={(event) => updateQr(index, { label: event.target.value })} />
                <Input label="Direct URL" placeholder="https://..." value={entry.url} onChange={(event) => updateQr(index, { url: event.target.value })} />
                <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3 rounded-xl" onClick={() => removeQr(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2">
                <FileUpload
                  label="Upload QR Image"
                  accept="image/*"
                  file={entry.file || null}
                  onChange={(files) => updateQr(index, { file: files?.[0] ?? null })}
                />
              </div>
              {(entry.file || entry.url) ? (
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border bg-white/50 p-2 shadow-sm">
                  <img src={entry.file ? URL.createObjectURL(entry.file) : entry.url} alt={entry.label || `QR ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              ) : null}
            </div>
          ))}
          {!form.qr_codes.length && (
            <div className="py-8 text-center rounded-xl border-2 border-dashed border-muted">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">No QR codes added</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] ml-1">Bank Details</p>
          <Button type="button" variant="outline" size="sm" onClick={addBank} className="rounded-xl h-8">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Bank
          </Button>
        </div>
        <div className="space-y-4">
          {form.bank_details.map((entry, index) => (
            <div key={`donation-bank-${index}`} className="space-y-3 rounded-2xl border border-[var(--tone-border)] p-4 bg-[var(--tone-surface-soft)]/30">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,1fr,auto] items-end">
                <Input label="Label" placeholder="e.g. BDO / PayMaya" value={entry.label} onChange={(event) => updateBank(index, { label: event.target.value })} />
                <Input label="Direct URL" placeholder="https://..." value={entry.url} onChange={(event) => updateBank(index, { url: event.target.value })} />
                <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3 rounded-xl" onClick={() => removeBank(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2">
                <FileUpload
                  label="Upload Bank Image"
                  accept="image/*"
                  file={entry.file || null}
                  onChange={(files) => updateBank(index, { file: files?.[0] ?? null })}
                />
              </div>
              {(entry.file || entry.url) ? (
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border bg-white/50 p-2 shadow-sm">
                  <img src={entry.file ? URL.createObjectURL(entry.file) : entry.url} alt={entry.label || `Bank ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              ) : null}
            </div>
          ))}
          {!form.bank_details.length && (
            <div className="py-8 text-center rounded-xl border-2 border-dashed border-muted">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">No bank details added</p>
            </div>
          )}
        </div>
      </Card>

      <div className="pt-4">
        <Button disabled={saving} onClick={() => void onSave()} className="w-full md:w-auto h-12 px-8 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
          {saving ? 'Saving...' : 'Save Donation Settings'}
        </Button>
      </div>
    </div>
  );
}
