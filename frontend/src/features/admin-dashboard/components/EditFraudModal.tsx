import { Button, Input } from '@/src/components/ui';
import type { EditFraudForm } from '@/src/features/admin-dashboard/types';

interface EditFraudModalProps {
  open: boolean;
  form: EditFraudForm;
  saving: boolean;
  onChange: (next: EditFraudForm) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function EditFraudModal({ open, form, saving, onChange, onCancel, onSave }: EditFraudModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold">Edit Fraud Entry</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input placeholder="Full name" value={form.full_name} onChange={(event) => onChange({ ...form, full_name: event.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} />
          <Input placeholder="Contact number" value={form.contact_number} onChange={(event) => onChange({ ...form, contact_number: event.target.value })} />
          <select
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.scope}
            onChange={(event) => onChange({ ...form, scope: event.target.value === 'global' ? 'global' : 'internal' })}
          >
            <option value="internal">Internal</option>
            <option value="global">Global</option>
          </select>
          <select
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.status}
            onChange={(event) => onChange({ ...form, status: event.target.value === 'pending' ? 'pending' : 'approved' })}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <Input
            placeholder="Evidence image URL"
            value={form.evidence_image_url}
            onChange={(event) => onChange({ ...form, evidence_image_url: event.target.value })}
          />
          <Input className="md:col-span-2" placeholder="Reason" value={form.reason} onChange={(event) => onChange({ ...form, reason: event.target.value })} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
}

