import { Button, Card, Input } from '@/src/components/ui';

interface SiteContentSection {
  title: string;
  body: string;
}

interface SiteContentForm {
  homeBadge: string;
  homeTitle: string;
  homeSubtitle: string;
  policySections: SiteContentSection[];
  faqText: string;
  rentalGuideText: string;
  footerAboutText: string;
  footerAboutLinksText: string;
  footerPolicyLinksText: string;
  footerUsefulLinksText: string;
  footerSocialLinksText: string;
}

interface SiteContentTabProps {
  form: SiteContentForm;
  saving: boolean;
  statusMessage?: string;
  statusTone?: 'success' | 'error' | 'neutral';
  onChange: (next: Partial<SiteContentForm>) => void;
  onSave: () => Promise<void>;
}

export function SiteContentTab({ form, saving, statusMessage, statusTone = 'neutral', onChange, onSave }: SiteContentTabProps) {
  const statusClass =
    statusTone === 'success'
      ? 'text-emerald-700'
      : statusTone === 'error'
        ? 'text-rose-700'
        : 'text-muted-foreground';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Site Content</h1>
        <div className="flex items-center gap-3">
          {statusMessage ? <span className={`text-xs ${statusClass}`}>{statusMessage}</span> : null}
          <Button disabled={saving} onClick={() => void onSave()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">Homepage</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input placeholder="Badge" value={form.homeBadge} onChange={(event) => onChange({ homeBadge: event.target.value })} />
          <Input placeholder="Title" value={form.homeTitle} onChange={(event) => onChange({ homeTitle: event.target.value })} />
        </div>
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Subtitle"
          value={form.homeSubtitle}
          onChange={(event) => onChange({ homeSubtitle: event.target.value })}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">Policies</h2>
        <p className="text-xs text-muted-foreground">Update the section titles and body text. Use new lines to separate paragraphs.</p>
        <div className="space-y-4">
          {form.policySections.map((section, index) => (
            <div key={`policy-section-${index}`} className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <Input
                placeholder={`Section ${index + 1} Title`}
                value={section.title}
                onChange={(event) => {
                  const next = [...form.policySections];
                  next[index] = { ...next[index], title: event.target.value };
                  onChange({ policySections: next });
                }}
              />
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Section body"
                value={section.body}
                onChange={(event) => {
                  const next = [...form.policySections];
                  next[index] = { ...next[index], body: event.target.value };
                  onChange({ policySections: next });
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">FAQ & Rental Guide</h2>
        <textarea
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="FAQ (one per line) — format: Question || Answer"
          value={form.faqText}
          onChange={(event) => onChange({ faqText: event.target.value })}
        />
        <textarea
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Rental guide items (one per line)"
          value={form.rentalGuideText}
          onChange={(event) => onChange({ rentalGuideText: event.target.value })}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">Footer</h2>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="About text"
          value={form.footerAboutText}
          onChange={(event) => onChange({ footerAboutText: event.target.value })}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="About links (one per line) — format: Label|page"
            value={form.footerAboutLinksText}
            onChange={(event) => onChange({ footerAboutLinksText: event.target.value })}
          />
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Policy links (one per line) — format: Label|page"
            value={form.footerPolicyLinksText}
            onChange={(event) => onChange({ footerPolicyLinksText: event.target.value })}
          />
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Useful links (one per line) — format: Label|page|login(optional)"
            value={form.footerUsefulLinksText}
            onChange={(event) => onChange({ footerUsefulLinksText: event.target.value })}
          />
          <textarea
            className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Social links (one per line) — format: Label|https://link"
            value={form.footerSocialLinksText}
            onChange={(event) => onChange({ footerSocialLinksText: event.target.value })}
          />
        </div>
      </Card>
    </div>
  );
}
