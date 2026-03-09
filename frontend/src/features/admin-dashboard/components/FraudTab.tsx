import { Globe, Search, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/src/components/ui';
import type { FraudListEntry } from '@/src/types/domain';

interface GlobalFraudForm {
  full_name: string;
  email: string;
  contact_number: string;
  requirement_files_text: string;
  reason: string;
  evidence_image_url: string;
}

interface FraudTabProps {
  fraudList: FraudListEntry[];
  fraudSearch: string;
  onFraudSearchChange: (value: string) => void;
  globalFraudForm: GlobalFraudForm;
  onGlobalFraudFormChange: (next: GlobalFraudForm) => void;
  onCreateGlobalFraud: () => void;
  onEdit: (entry: FraudListEntry) => void;
  onApproveGlobal: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}

export function FraudTab({
  fraudList,
  fraudSearch,
  onFraudSearchChange,
  globalFraudForm,
  onGlobalFraudFormChange,
  onCreateGlobalFraud,
  onEdit,
  onApproveGlobal,
  onDelete,
  onExport,
}: FraudTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fraud Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>Export Fraud Excel</Button>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search fraud list..." value={fraudSearch} onChange={(event) => onFraudSearchChange(event.target.value)} />
          </div>
        </div>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <Input
          placeholder="Full name"
          value={globalFraudForm.full_name}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, full_name: event.target.value })}
        />
        <Input
          placeholder="Email"
          value={globalFraudForm.email}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, email: event.target.value })}
        />
        <Input
          placeholder="Contact number"
          value={globalFraudForm.contact_number}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, contact_number: event.target.value })}
        />
        <Input
          placeholder="Reason"
          value={globalFraudForm.reason}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, reason: event.target.value })}
        />
        <Input
          placeholder="Evidence image URL (optional)"
          value={globalFraudForm.evidence_image_url}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, evidence_image_url: event.target.value })}
        />
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:col-span-2"
          placeholder="Requirement files (optional). One per line. Format: TYPE|https://file-url"
          value={globalFraudForm.requirement_files_text}
          onChange={(event) => onGlobalFraudFormChange({ ...globalFraudForm, requirement_files_text: event.target.value })}
        />
        <div className="md:col-span-2">
          <Button onClick={onCreateGlobalFraud}>Add Global Fraud</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-sm font-semibold">Reported Person</th>
              <th className="p-4 text-sm font-semibold">Contact Info</th>
              <th className="p-4 text-sm font-semibold">Reason</th>
              <th className="p-4 text-sm font-semibold">Scope</th>
              <th className="p-4 text-sm font-semibold">Status</th>
              <th className="p-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fraudList.map((entry) => (
              <tr key={entry.id} className="border-t transition-colors hover:bg-muted/30">
                <td className="p-4">
                  <p className="font-medium">{entry.full_name}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm">{entry.email}</p>
                  <p className="text-xs text-muted-foreground">{entry.contact_number}</p>
                </td>
                <td className="p-4">
                  <p className="line-clamp-2 text-sm">{entry.reason}</p>
                  {entry.global_request_reason ? <p className="text-[10px] text-muted-foreground">Global request: {entry.global_request_reason}</p> : null}
                  {entry.evidence_image_url ? (
                    <a href={entry.evidence_image_url} target="_blank" rel="noreferrer" className="text-[10px] underline">
                      View evidence
                    </a>
                  ) : null}
                  {(entry.requirement_files || []).map((file, index) => (
                    <p key={`${entry.id}-req-${index}`}>
                      <a href={file.url} target="_blank" rel="noreferrer" className="text-[10px] underline">
                        {file.type || `Requirement ${index + 1}`}
                      </a>
                    </p>
                  ))}
                  <p className="text-[10px] text-muted-foreground">By: {entry.reported_by_email}</p>
                </td>
                <td className="p-4">
                  {entry.scope === 'global' ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                      <Globe className="h-2 w-2" /> Global
                    </span>
                  ) : entry.store_id ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Store: {entry.store_name}</span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Internal</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${entry.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {entry.status || 'approved'}
                  </span>
                </td>
                <td className="space-x-2 p-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>Edit</Button>
                  {entry.scope === 'global' && entry.status === 'pending' && (
                    <Button variant="ghost" size="sm" onClick={() => onApproveGlobal(entry.id)}>Approve Global</Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
