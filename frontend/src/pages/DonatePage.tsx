import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { Button, Card } from '@/src/components/ui';
import { api } from '@/src/lib/api';
import { AppFooter } from '@/src/components/layout/AppFooter';
import type { AppPage } from '@/src/types/app';
import type { DonationSettings } from '@/src/types/domain';

interface DonatePageProps {
  onNavigate: (page: AppPage) => void;
  content?: import('@/src/types/domain').SiteContent;
}

const fallbackSettings: DonationSettings = {
  message: 'Support this website by donating funds for its maintenance. Any amount will be appreciated.',
  qr_codes: [],
  bank_details: [],
  is_active: true,
};

export function DonatePage({ onNavigate, content }: DonatePageProps) {
  const [settings, setSettings] = useState<DonationSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DonationSettings>('/api/donation-settings')
      .then((data) => setSettings({ ...fallbackSettings, ...data }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--tone-bg)]">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-3">
            <h1 className="inline-flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              <HeartHandshake className="h-8 w-8 text-[var(--tone-accent)]" />
              Support CamRent PH
            </h1>
            <p className="text-muted-foreground">{settings.message || fallbackSettings.message}</p>
            <Button variant="outline" onClick={() => onNavigate('home')}>
              Back to Home
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading support details...</p>
          ) : (
            <>
              {(settings.qr_codes || []).length ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">QR Codes</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(settings.qr_codes || []).map((entry, index) => (
                      <Card key={`${entry.url}-${index}`} className="space-y-2 p-4">
                        <p className="text-sm font-semibold">{entry.label || `QR Code ${index + 1}`}</p>
                        <button
                          type="button"
                          className="flex h-56 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-3"
                          onClick={() => setPreviewImageUrl(entry.url)}
                        >
                          <img src={entry.url} alt={entry.label || `QR Code ${index + 1}`} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                        </button>
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null}

              {(settings.bank_details || []).length ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Bank Details</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(settings.bank_details || []).map((entry, index) => (
                      <Card key={`${entry.label}-${index}`} className="space-y-2 p-4">
                        <p className="text-sm font-semibold">{entry.label || `Bank ${index + 1}`}</p>
                        {entry.url ? (
                          <button
                            type="button"
                            className="flex h-56 w-full items-center justify-center overflow-hidden rounded-md border bg-muted/30 p-3"
                            onClick={() => setPreviewImageUrl(entry.url)}
                          >
                            <img src={entry.url} alt={entry.label || `Bank ${index + 1}`} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                          </button>
                        ) : (
                          <p className="text-sm text-muted-foreground">No bank image uploaded.</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
      {previewImageUrl ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="max-h-[90vh] max-w-6xl overflow-auto rounded-xl bg-background p-3" onClick={(event) => event.stopPropagation()}>
            <img src={previewImageUrl} alt="Preview" className="h-auto max-h-[85vh] w-auto max-w-full object-contain" />
          </div>
        </div>
      ) : null}
      <AppFooter onNavigate={onNavigate} content={content} />
    </div>
  );
}
