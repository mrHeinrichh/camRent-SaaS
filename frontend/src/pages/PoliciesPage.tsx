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
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Policies & Terms</h1>
          <p className="text-muted-foreground">
            CamRent PH policy framework for platform use, security notice, liability limitations, fraud controls, and rental operations guidance.
          </p>
          <div>
            <Button variant="outline" onClick={() => onNavigate('home')}>
              Back to Home
            </Button>
          </div>
        </div>

        {resolved.policies.sections.map((section, index) => {
          const title = section.title || `Section ${index + 1}`;
          const isGuide = title.toLowerCase().includes('rental guide');
          const isFaq = title.toLowerCase().includes('faq');
          return (
            <section key={`${title}-${index}`} className="space-y-3 rounded-xl border bg-card p-5">
              <h2 className="text-xl font-semibold">{title}</h2>
              {section.body
                .split('\n')
                .filter(Boolean)
                .map((paragraph, paragraphIndex) => (
                  <p key={`${title}-${paragraphIndex}`} className="text-sm text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              {isGuide ? (
                <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
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
