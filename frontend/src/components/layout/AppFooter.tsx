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
    <footer className="mt-16 border-t border-[var(--tone-nav-border)] bg-[var(--tone-surface)]">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3">
          <p className="text-base font-extrabold text-[var(--tone-text)]">CamRent PH</p>
          <p className="text-sm text-muted-foreground">{footer.about_text}</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">About Us</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {footer.about_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-foreground"
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
          <h4 className="text-sm font-bold uppercase tracking-wide">Policies</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {footer.policy_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-foreground"
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
          <h4 className="text-sm font-bold uppercase tracking-wide">Useful Links</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {footer.useful_links.map((link) => (
              <button
                key={link.label}
                type="button"
                className="block text-left hover:text-foreground"
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
          <h4 className="text-sm font-bold uppercase tracking-wide">Follow Us</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            {footer.social_links.map((link) => (
              <a key={link.label} href={link.url} className="block hover:text-foreground">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--tone-nav-border)] py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} CamRent PH. All rights reserved.</div>
    </footer>
  );
}
