import { Download, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/src/components/ui';
import type { Announcement } from '@/src/types/domain';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  globalEnabled: boolean;
  form: {
    title: string;
    description: string;
    image_url: string;
    cta_label: string;
    cta_url: string;
    is_active: boolean;
    sort_order: string;
    imageFile: File | null;
  };
  editingId: string | null;
  saving: boolean;
  onFormChange: (next: Partial<AnnouncementsTabProps['form']>) => void;
  onSubmit: () => Promise<void>;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, nextValue: boolean) => Promise<void>;
  onToggleGlobal: (nextValue: boolean) => Promise<void>;
  onExport: () => void;
}

export function AnnouncementsTab({
  announcements,
  globalEnabled,
  form,
  editingId,
  saving,
  onFormChange,
  onSubmit,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleGlobal,
  onExport,
}: AnnouncementsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Announcement Carousel</h1>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
          <span>Show announcements on homepage</span>
          <button
            type="button"
            role="switch"
            aria-checked={globalEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${globalEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
            onClick={() => void onToggleGlobal(!globalEnabled)}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${globalEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <Input placeholder="Title (optional)" value={form.title} onChange={(event) => onFormChange({ title: event.target.value })} />
        <Input placeholder="Sort order (0 = first)" value={form.sort_order} onChange={(event) => onFormChange({ sort_order: event.target.value })} />
        <Input className="md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => onFormChange({ description: event.target.value })} />
        <Input className="md:col-span-2" placeholder="Image URL (optional)" value={form.image_url} onChange={(event) => onFormChange({ image_url: event.target.value })} />
        <div className="md:col-span-2">
          <Input type="file" accept="image/*" onChange={(event) => onFormChange({ imageFile: event.target.files?.[0] ?? null })} />
        </div>
        <Input placeholder="CTA Label (optional)" value={form.cta_label} onChange={(event) => onFormChange({ cta_label: event.target.value })} />
        <Input placeholder="CTA URL (optional)" value={form.cta_url} onChange={(event) => onFormChange({ cta_url: event.target.value })} />
        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(event) => onFormChange({ is_active: event.target.checked })} />
          Active (visible on customer dashboard)
        </label>
        <div className="md:col-span-2">
          <Button disabled={saving} onClick={() => void onSubmit()}>
            <Megaphone className="mr-2 h-4 w-4" /> {editingId ? 'Update Announcement' : 'Create Announcement'}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="space-y-3 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[7rem,1fr,auto] md:items-start">
              <div className="h-24 w-28 overflow-hidden rounded border bg-muted">
                {announcement.image_url ? <img src={announcement.image_url} alt={announcement.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>}
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">{announcement.description || '-'}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {announcement.is_active ? 'active' : 'inactive'} • Sort: {announcement.sort_order}
                </p>
                {(announcement.cta_label || announcement.cta_url) && <p className="text-xs text-muted-foreground">CTA: {announcement.cta_label || '-'} {announcement.cta_url || ''}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Visible</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={announcement.is_active}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${announcement.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    onClick={() => void onToggleActive(announcement.id, !announcement.is_active)}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${announcement.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => void onDelete(announcement.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!announcements.length && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
      </div>
    </div>
  );
}
