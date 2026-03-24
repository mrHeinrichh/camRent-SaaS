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
  validationErrors?: Record<string, string>;
  clearValidationError?: (field: string) => void;
}

export function SiteContentTab({
  form,
  saving,
  statusMessage,
  statusTone = 'neutral',
  onChange,
  onSave,
  validationErrors = {},
  clearValidationError,
}: SiteContentTabProps) {
  const statusClass =
    statusTone === 'success'
      ? 'text-emerald-700'
      : statusTone === 'error'
        ? 'text-rose-700'
        : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold font-outfit">Site Content</h1>
        <div className="flex items-center gap-3">
          {statusMessage ? <span className={`text-[10px] font-black uppercase tracking-widest ${statusClass}`}>{statusMessage}</span> : null}
          <Button disabled={saving} onClick={() => void onSave()} className="h-10 px-6 font-bold rounded-xl shadow-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold font-outfit">Homepage Hero</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Badge Text" placeholder="e.g. NEW" value={form.homeBadge} onChange={(event) => onChange({ homeBadge: event.target.value })} />
          <Input label="Main Title" placeholder="Welcome to..." value={form.homeTitle} onChange={(event) => onChange({ homeTitle: event.target.value })} />
        </div>
        <div className="flex flex-col">
          <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Subtitle</label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
            placeholder="Describe your platform"
            value={form.homeSubtitle}
            onChange={(event) => onChange({ homeSubtitle: event.target.value })}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold font-outfit">Platform Policies</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Update sections and body text. Paragraphs are split by new lines.</p>
        <div className="space-y-4">
          {form.policySections.map((section, index) => (
            <div key={`policy-section-${index}`} className="rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)]/20 p-4 space-y-3">
              <Input
                label={`Section ${index + 1} Title`}
                placeholder="Policy title"
                value={section.title}
                onChange={(event) => {
                  const next = [...form.policySections];
                  next[index] = { ...next[index], title: event.target.value };
                  onChange({ policySections: next });
                }}
              />
              <div className="flex flex-col">
                <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Content</label>
                <textarea
                  className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
                  placeholder="Policy body..."
                  value={section.body}
                  onChange={(event) => {
                    const next = [...form.policySections];
                    next[index] = { ...next[index], body: event.target.value };
                    onChange({ policySections: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold font-outfit">FAQ & Rental Guide</h2>
        <div className="flex flex-col">
          <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">FAQ (Question || Answer per line)</label>
          <textarea
            className={`min-h-32 w-full rounded-xl border px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)] ${
              validationErrors.siteFaq ? 'border-red-500' : 'border-[var(--tone-border)] bg-[var(--tone-surface-soft)]'
            }`}
            placeholder="How to rent? || Just click rent!"
            value={form.faqText}
            onChange={(event) => {
              onChange({ faqText: event.target.value });
              clearValidationError?.('siteFaq');
            }}
          />
          {validationErrors.siteFaq && <p className="mt-1.5 ml-1 text-xs font-bold text-red-500">{validationErrors.siteFaq}</p>}
        </div>
        <div className="flex flex-col">
          <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Rental Guide Items (One per line)</label>
          <textarea
            className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
            placeholder="Step 1: Choose gear"
            value={form.rentalGuideText}
            onChange={(event) => onChange({ rentalGuideText: event.target.value })}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold font-outfit">Global Footer</h2>
        <div className="flex flex-col">
          <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">About Us Description</label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
            placeholder="About the company"
            value={form.footerAboutText}
            onChange={(event) => onChange({ footerAboutText: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">About Links (Label|page)</label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
              placeholder="Team|team"
              value={form.footerAboutLinksText}
              onChange={(event) => onChange({ footerAboutLinksText: event.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Policy Links (Label|page)</label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
              placeholder="Terms|terms"
              value={form.footerPolicyLinksText}
              onChange={(event) => onChange({ footerPolicyLinksText: event.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Useful Links (Label|page|login?)</label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
              placeholder="Dashboard|dashboard|true"
              value={form.footerUsefulLinksText}
              onChange={(event) => onChange({ footerUsefulLinksText: event.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Social Links (Label|URL)</label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--tone-accent)]"
              placeholder="Facebook|https://fb.com/..."
              value={form.footerSocialLinksText}
              onChange={(event) => onChange({ footerSocialLinksText: event.target.value })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
