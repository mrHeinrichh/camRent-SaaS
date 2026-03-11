import type { AppPage } from '@/src/types/app';
import type { SiteContent } from '@/src/types/domain';
import { defaultSiteContent, mergeSiteContent } from '@/src/config/siteContentDefaults';

interface AppFooterProps {
  onNavigate: (page: AppPage) => void;
  content?: SiteContent;
}

export function AppFooter({ onNavigate, content }: AppFooterProps) {
  const resolved = mergeSiteContent(defaultSiteContent, content as any);
  const footer = resolved.footer;
  return (
    <footer className="mt-16 bg-[var(--tone-bg)]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3">
            <p className="text-lg font-extrabold text-slate-900">CamRent PH</p>
            <p className="text-sm text-slate-500">{footer.about_text}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">About Us</h4>
            <div className="space-y-2 text-sm text-slate-500">
            {footer.about_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-slate-900"
                onClick={() => {
                  if (link.page) onNavigate(link.page as AppPage);
                  if (link.url) window.open(link.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Policies</h4>
            <div className="space-y-2 text-sm text-slate-500">
            {footer.policy_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-slate-900"
                onClick={() => {
                  if (link.page) onNavigate(link.page as AppPage);
                  if (link.url) window.open(link.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Useful Links</h4>
            <div className="space-y-2 text-sm text-slate-500">
            {footer.useful_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-slate-900"
                onClick={() => {
                  if (link.requires_login) alert('You must login to add feedback.');
                  if (link.page) onNavigate(link.page as AppPage);
                  if (link.url) window.open(link.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

          <div className="space-y-3">
            <h4 className="text-base font-extrabold uppercase tracking-wide text-slate-900">Follow Us</h4>
            <div className="space-y-2 text-sm text-slate-500">
            {footer.social_links.map((link) => (
              <a key={link.label} href={link.url} className="block hover:text-slate-900">
                {link.label}
              </a>
            ))}
            </div>
          </div>
        </div>
      </div>
      <div className="py-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} CamRent PH. All rights reserved.</div>
    </footer>
  );
}
