import { siteTheme } from '@/src/config/siteTheme';
import { faqItems, rentalGuideItems } from '@/src/features/policies/data';

export const defaultSiteContent = {
  home: {
    badge: siteTheme.home.badge,
    title: siteTheme.home.title,
    subtitle: siteTheme.home.subtitle,
  },
  policies: {
    sections: [
      {
        title: '1) Service Scope and Platform Nature',
        body:
          'CamRent PH is a software platform for camera rental management. It is not a direct seller of physical products and does not yet provide native end-to-end payment integration. Payment automation is planned but still subject to technical, operational, and legal requirements.\n\nUntil official payment integration is released, stores and customers are responsible for arranging payment settlement using methods provided by each store. Stores may also continue marketing through social media pages while using CamRent PH for operations.\n\nRefunds, disputes, and payment reversals are handled by the store owner at their discretion. CamRent PH is not liable for losses and does not guarantee any transaction outcome. Users are required to read the store’s policies and the platform policies carefully before proceeding.',
      },
      {
        title: '2) Data Responsibility and Confidentiality',
        body:
          'The platform stores customer, order, and inventory data in a centralized system to support core features such as tracking, history, reporting, and fraud alerts. Access is role-based and intended for authorized usage only.\n\nStore owners are encouraged to export records regularly for operational backup and independent recordkeeping. Users remain responsible for the data they upload, including personal documents and billing references.',
      },
      {
        title: '3) Security Notice and Liability Disclaimer',
        body:
          'CamRent PH applies security controls, but no platform can guarantee absolute safety against all attack vectors. Breach attempts, unknown vulnerabilities, service interruptions, and third-party incidents may still occur.\n\nBy using this website and uploading data, users acknowledge that platform usage is at their own risk. CamRent PH disclaims liability for data leakage, compromise, or losses arising from attacks, misuse, external provider failures, or force majeure events.',
      },
      {
        title: '4) Fraud Reporting and Compliance',
        body:
          'Fraud protection is a core priority. Stores may create internal fraud records and escalate high-risk cases to global review. Global escalation is subject to moderation, evidence review, and approval workflow.\n\nFalse reporting, harassment, or abuse of fraud systems is prohibited and may result in account restrictions, audit review, or removal from platform access.',
      },
      {
        title: '5) Rental Guide',
        body: 'Best-practice recommendations for store owners and staff:',
      },
      {
        title: '6) Helps & FAQ',
        body: 'Open each question to view the answer.',
      },
    ],
    faq_items: faqItems.map((item) => ({ q: item.q, a: item.a })),
    rental_guide_items: rentalGuideItems.slice(),
  },
  footer: {
    about_text: 'Camera rental workflow platform built for inventory management, renter history, and fraud monitoring for rental businesses.',
    about_links: [
      { label: 'Who We Are', page: 'about' },
      { label: 'Founder', page: 'about' },
      { label: 'Mission', page: 'about' },
    ],
    policy_links: [
      { label: 'Terms & Conditions', page: 'policies' },
      { label: 'Privacy Policy', page: 'policies' },
      { label: 'Data & Security Notice', page: 'policies' },
    ],
    useful_links: [
      { label: 'Helps & FAQ', page: 'policies' },
      { label: 'Feedback', page: 'login', requires_login: true },
      { label: 'Rental Guide', page: 'policies' },
      { label: 'Support This Website', page: 'donate' },
    ],
    social_links: [
      { label: 'Facebook', url: '#' },
      { label: 'Instagram', url: '#' },
      { label: 'TikTok', url: '#' },
    ],
  },
} as const;

export function mergeSiteContent<T extends typeof defaultSiteContent>(base: T, override?: Partial<T>) {
  if (!override) return base;
  return {
    home: { ...base.home, ...(override.home || {}) },
    policies: {
      sections: override.policies?.sections?.length ? override.policies.sections : base.policies.sections,
      faq_items: override.policies?.faq_items?.length ? override.policies.faq_items : base.policies.faq_items,
      rental_guide_items: override.policies?.rental_guide_items?.length ? override.policies.rental_guide_items : base.policies.rental_guide_items,
    },
    footer: {
      about_text: override.footer?.about_text ?? base.footer.about_text,
      about_links: override.footer?.about_links?.length ? override.footer.about_links : base.footer.about_links,
      policy_links: override.footer?.policy_links?.length ? override.footer.policy_links : base.footer.policy_links,
      useful_links: override.footer?.useful_links?.length ? override.footer.useful_links : base.footer.useful_links,
      social_links: override.footer?.social_links?.length ? override.footer.social_links : base.footer.social_links,
    },
  } as T;
}
