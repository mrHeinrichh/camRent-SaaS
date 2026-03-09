import type { AppPage } from '@/src/types/app';
import { siteTheme } from '@/src/config/siteTheme';

interface AppFooterProps {
  onNavigate: (page: AppPage) => void;
}

export function AppFooter({ onNavigate }: AppFooterProps) {
  return (
    <footer className="mt-16 border-t border-[var(--tone-nav-border)] bg-[var(--tone-surface)]">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3">
          <p className="text-base font-extrabold text-[var(--tone-text)]">{siteTheme.brandName}</p>
          <p className="text-sm text-muted-foreground">
            Camera rental workflow platform built for inventory management, renter history, and fraud monitoring for rental businesses.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">About Us</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('about')}>
              Who We Are
            </button>
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('about')}>
              Founder
            </button>
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('about')}>
              Mission
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">Policies</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('policies')}>
              Terms & Conditions
            </button>
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('policies')}>
              Privacy Policy
            </button>
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('policies')}>
              Data & Security Notice
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">Useful Links</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('policies')}>
              Helps & FAQ
            </button>
            <button
              type="button"
              className="block hover:text-foreground"
              onClick={() => {
                alert('You must login to add feedback.');
                onNavigate('login');
              }}
            >
              Feedback
            </button>
            <button type="button" className="block hover:text-foreground" onClick={() => onNavigate('policies')}>
              Rental Guide
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wide">Follow Us</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="#" className="block hover:text-foreground">
              Facebook
            </a>
            <a href="#" className="block hover:text-foreground">
              Instagram
            </a>
            <a href="#" className="block hover:text-foreground">
              TikTok
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--tone-nav-border)] py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {siteTheme.brandName}. All rights reserved.</div>
    </footer>
  );
}
