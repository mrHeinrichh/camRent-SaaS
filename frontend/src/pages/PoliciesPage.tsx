import { Button } from '@/src/components/ui';
import { FaqAccordion } from '@/src/features/policies/components/FaqAccordion';
import type { SiteContent } from '@/src/types/domain';
import { defaultSiteContent, mergeSiteContent } from '@/src/config/siteContentDefaults';
import type { AppPage } from '@/src/types/app';

interface PoliciesPageProps {
  onNavigate: (page: AppPage) => void;
  content?: SiteContent;
}

export function PoliciesPage({ onNavigate, content }: PoliciesPageProps) {
  const resolved = mergeSiteContent(defaultSiteContent, content as any);
  return (
    <div className="min-h-screen bg-[var(--tone-bg)] px-4 py-10">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CamRent PH</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Policies & Terms</h1>
          <p className="mt-2 text-sm text-slate-500">
            CamRent PH policy framework for platform use, security notice, liability limitations, fraud controls, and rental operations guidance.
          </p>
          <div className="mt-4">
            <Button variant="outline" className="rounded-full" onClick={() => onNavigate('home')}>
              Back to Home
            </Button>
          </div>
        </div>

        {resolved.policies.sections.map((section, index) => {
          const title = section.title || `Section ${index + 1}`;
          const isGuide = title.toLowerCase().includes('rental guide');
          const isFaq = title.toLowerCase().includes('faq');
          return (
            <section key={`${title}-${index}`} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {section.body
                .split('\n')
                .filter(Boolean)
                .map((paragraph, paragraphIndex) => (
                  <p key={`${title}-${paragraphIndex}`} className="text-sm text-slate-500">
                    {paragraph}
                  </p>
                ))}
              {isGuide ? (
                <ul className="list-disc space-y-2 pl-6 text-sm text-slate-500">
                  {resolved.policies.rental_guide_items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {isFaq ? <FaqAccordion items={resolved.policies.faq_items} /> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
