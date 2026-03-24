import { Download, Megaphone, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';
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
  validationErrors?: Record<string, string>;
  clearValidationError?: (field: string) => void;
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
  validationErrors = {},
  clearValidationError,
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
        <Input
          label="Title"
          placeholder="Enter title"
          value={form.title}
          onChange={(event) => onFormChange({ title: event.target.value })}
        />
        <Input
          label="Sort Order"
          placeholder="0 = first"
          value={form.sort_order}
          onChange={(event) => onFormChange({ sort_order: event.target.value })}
        />
        <Input
          className="md:col-span-2"
          label="Description"
          placeholder="Enter announcement description"
          value={form.description}
          onChange={(event) => {
            onFormChange({ description: event.target.value });
            clearValidationError?.('annoDesc');
          }}
          error={validationErrors.annoDesc}
        />
        <Input
          className="md:col-span-2"
          label="Image URL"
          placeholder="Direct image link"
          value={form.image_url}
          onChange={(event) => onFormChange({ image_url: event.target.value })}
        />
        <div className="md:col-span-2">
          <FileUpload
            label="Announcement Image"
            accept="image/*"
            file={form.imageFile}
            onChange={(files) => {
              onFormChange({ imageFile: files?.[0] ?? null });
              clearValidationError?.('annoFile');
            }}
          />
          {validationErrors.annoFile && <p className="mt-1 text-xs font-bold text-red-500">{validationErrors.annoFile}</p>}
        </div>
        <Input
          label="CTA Label"
          placeholder="Button text"
          value={form.cta_label}
          onChange={(event) => onFormChange({ cta_label: event.target.value })}
        />
        <Input
          label="CTA URL"
          placeholder="https://..."
          value={form.cta_url}
          onChange={(event) => onFormChange({ cta_url: event.target.value })}
        />
        <label className="md:col-span-2 inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(event) => onFormChange({ is_active: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="font-medium">Visible on Customer Dashboards</span>
        </label>
        <div className="md:col-span-2 pt-2">
          <Button disabled={saving} onClick={() => void onSubmit()} className="w-full md:w-auto">
            <Megaphone className="mr-2 h-4 w-4" /> {editingId ? 'Update Announcement' : 'Create Announcement'}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {announcements.sort((a,b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)).map((announcement) => (
          <Card key={announcement.id} className="space-y-3 p-5 transition-all hover:shadow-md">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[7rem,1fr,auto] md:items-start">
              <div className="h-24 w-28 overflow-hidden rounded-lg border bg-muted shadow-sm">
                {announcement.image_url ? <img src={announcement.image_url} alt={announcement.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground uppercase font-black">No img</div>}
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg">{announcement.title || 'Untitled Announcement'}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{announcement.description || '-'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                    Status: <span className={announcement.is_active ? 'text-emerald-600' : 'text-slate-400'}>{announcement.is_active ? 'active' : 'inactive'}</span>
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                    Sort: <span className="text-[var(--tone-text)] font-bold">{announcement.sort_order}</span>
                  </p>
                  {(announcement.cta_label || announcement.cta_url) && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                      CTA: <span className="text-[var(--tone-text)] font-bold">{announcement.cta_label || '-'}</span> <span className="text-blue-500 underline lowercase font-normal italic">{announcement.cta_url || ''}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end pt-2 md:pt-0">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mr-2">
                  <span>Visible</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={announcement.is_active}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${announcement.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    onClick={() => void onToggleActive(announcement.id, !announcement.is_active)}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${announcement.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <Button size="sm" variant="outline" onClick={() => onEdit(announcement)} className="rounded-xl">
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => void onDelete(announcement.id)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!announcements.length && (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed border-muted">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No announcements listed</p>
          </div>
        )}
      </div>
    </div>
  );
}
