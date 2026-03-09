import { Download, Plus, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/src/components/ui';

interface DonationQrInput {
  label: string;
  url: string;
  file: File | null;
}

interface DonationBankInput {
  label: string;
  account_name: string;
  account_number: string;
  notes: string;
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
}

export function DonationsTab({ form, saving, onChange, onSave, onExport }: DonationsTabProps) {
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
  const addBank = () => onChange({ bank_details: [...form.bank_details, { label: '', account_name: '', account_number: '', notes: '' }] });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Donation Settings</h1>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Support Page Message</p>
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={form.message}
          onChange={(event) => onChange({ message: event.target.value })}
          placeholder="Support this website by donating funds for its maintenance. Any amount will be appreciated."
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(event) => onChange({ is_active: event.target.checked })} />
          Donation page is active
        </label>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">QR Codes</p>
          <Button type="button" variant="outline" size="sm" onClick={addQr}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add QR
          </Button>
        </div>
        <div className="space-y-3">
          {form.qr_codes.map((entry, index) => (
            <div key={`donation-qr-${index}`} className="space-y-2 rounded-md border p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr,1fr,auto]">
                <Input placeholder="Label" value={entry.label} onChange={(event) => updateQr(index, { label: event.target.value })} />
                <Input placeholder="Image URL (optional)" value={entry.url} onChange={(event) => updateQr(index, { url: event.target.value })} />
                <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeQr(index)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              </div>
              <Input type="file" accept="image/*" onChange={(event) => updateQr(index, { file: event.target.files?.[0] ?? null })} />
              {(entry.file || entry.url) ? (
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-2">
                  <img src={entry.file ? URL.createObjectURL(entry.file) : entry.url} alt={entry.label || `QR ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              ) : null}
            </div>
          ))}
          {!form.qr_codes.length && <p className="text-sm text-muted-foreground">No QR codes yet.</p>}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Bank Details</p>
          <Button type="button" variant="outline" size="sm" onClick={addBank}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Bank
          </Button>
        </div>
        <div className="space-y-3">
          {form.bank_details.map((entry, index) => (
            <div key={`donation-bank-${index}`} className="space-y-2 rounded-md border p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input placeholder="Bank / Channel Label" value={entry.label} onChange={(event) => updateBank(index, { label: event.target.value })} />
                <Input placeholder="Account Name" value={entry.account_name} onChange={(event) => updateBank(index, { account_name: event.target.value })} />
                <Input placeholder="Account Number" value={entry.account_number} onChange={(event) => updateBank(index, { account_number: event.target.value })} />
                <Input placeholder="Notes (optional)" value={entry.notes} onChange={(event) => updateBank(index, { notes: event.target.value })} />
              </div>
              <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeBank(index)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          ))}
          {!form.bank_details.length && <p className="text-sm text-muted-foreground">No bank details yet.</p>}
        </div>
      </Card>

      <div>
        <Button disabled={saving} onClick={() => void onSave()}>
          {saving ? 'Saving...' : 'Save Donation Settings'}
        </Button>
      </div>
    </div>
  );
}
