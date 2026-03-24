import { Button, Input } from '@/src/components/ui';
import type { EditFraudForm } from '@/src/features/admin-dashboard/types';

interface EditFraudModalProps {
  open: boolean;
  form: EditFraudForm;
  saving: boolean;
  onChange: (next: EditFraudForm) => void;
  onCancel: () => void;
  onSave: () => void;
  validationErrors?: Record<string, string>;
  clearValidationError?: (field: string) => void;
}

export function EditFraudModal({
  open,
  form,
  saving,
  onChange,
  onCancel,
  onSave,
  validationErrors = {},
  clearValidationError,
}: EditFraudModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 font-inter">
      <div className="i3d-modal w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl">
        <h3 className="mb-4 text-xl font-bold">Edit Fraud Entry</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="Enter full name"
            value={form.full_name}
            onChange={(event) => {
              onChange({ ...form, full_name: event.target.value });
              clearValidationError?.('fraudName');
            }}
            error={validationErrors.fraudName}
          />
          <Input
            label="Email Address"
            placeholder="Enter email"
            value={form.email}
            onChange={(event) => {
              onChange({ ...form, email: event.target.value });
              clearValidationError?.('fraudEmail');
            }}
            error={validationErrors.fraudEmail}
          />
          <Input
            label="Contact Number"
            placeholder="Enter contact number"
            value={form.contact_number}
            onChange={(event) => {
              onChange({ ...form, contact_number: event.target.value });
              clearValidationError?.('fraudContact');
            }}
          />
          <div className="flex flex-col">
            <label className="mb-1 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Scope</label>
            <select
              className="h-12 rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm text-[var(--tone-text)] focus-within:bg-[var(--tone-surface)] focus-visible:outline-none focus-visible:border-[var(--tone-accent)]"
              value={form.scope}
              onChange={(event) => onChange({ ...form, scope: event.target.value === 'global' ? 'global' : 'internal' })}
            >
              <option value="internal">Internal Only</option>
              <option value="global">Global (Platform Wide)</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Status</label>
            <select
              className="h-12 rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm text-[var(--tone-text)] focus-within:bg-[var(--tone-surface)] focus-visible:outline-none focus-visible:border-[var(--tone-accent)]"
              value={form.status}
              onChange={(event) => onChange({ ...form, status: event.target.value === 'pending' ? 'pending' : 'approved' })}
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <Input
            label="Evidence Image URL"
            placeholder="Enter image URL"
            value={form.evidence_image_url}
            onChange={(event) => onChange({ ...form, evidence_image_url: event.target.value })}
          />
          <Input
            className="md:col-span-2"
            label="Reason"
            placeholder="Enter detailed reason"
            value={form.reason}
            onChange={(event) => {
              onChange({ ...form, reason: event.target.value });
              clearValidationError?.('fraudReason');
            }}
            error={validationErrors.fraudReason}
          />
          <div className="md:col-span-2">
            <label className="mb-1 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Requirement Files</label>
            <textarea
              className={`min-h-24 w-full rounded-xl border px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                validationErrors.fraudFiles ? 'border-red-500' : 'border-[var(--tone-border)] bg-[var(--tone-surface-soft)]'
              }`}
              placeholder="One per line. Format: TYPE|https://file-url"
              value={form.requirement_files_text}
              onChange={(event) => {
                onChange({ ...form, requirement_files_text: event.target.value });
                clearValidationError?.('fraudFiles');
              }}
            />
            {validationErrors.fraudFiles && <p className="mt-1 text-xs font-bold text-red-500">{validationErrors.fraudFiles}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
}
