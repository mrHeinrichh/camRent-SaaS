import { Button } from '@/src/components/ui';
import { FaqAccordion } from '@/src/features/policies/components/FaqAccordion';
import { faqItems, rentalGuideItems } from '@/src/features/policies/data';
import type { AppPage } from '@/src/types/app';

interface PoliciesPageProps {
  onNavigate: (page: AppPage) => void;
}

export function PoliciesPage({ onNavigate }: PoliciesPageProps) {
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

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">1) Service Scope and Platform Nature</h2>
          <p className="text-sm text-muted-foreground">
            CamRent PH is a software platform for camera rental management. It is not a direct seller of physical products and does not yet provide native end-to-end payment integration.
            Payment automation is planned but still subject to technical, operational, and legal requirements.
          </p>
          <p className="text-sm text-muted-foreground">
            Until official payment integration is released, stores and customers are responsible for arranging payment settlement using methods provided by each store.
            Stores may also continue marketing through social media pages while using CamRent PH for operations.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">2) Data Responsibility and Confidentiality</h2>
          <p className="text-sm text-muted-foreground">
            The platform stores customer, order, and inventory data in a centralized system to support core features such as tracking, history, reporting, and fraud alerts.
            Access is role-based and intended for authorized usage only.
          </p>
          <p className="text-sm text-muted-foreground">
            Store owners are encouraged to export records regularly for operational backup and independent recordkeeping.
            Users remain responsible for the data they upload, including personal documents and billing references.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">3) Security Notice and Liability Disclaimer</h2>
          <p className="text-sm text-muted-foreground">
            CamRent PH applies security controls, but no platform can guarantee absolute safety against all attack vectors.
            Breach attempts, unknown vulnerabilities, service interruptions, and third-party incidents may still occur.
          </p>
          <p className="text-sm text-muted-foreground">
            By using this website and uploading data, users acknowledge that platform usage is at their own risk.
            CamRent PH disclaims liability for data leakage, compromise, or losses arising from attacks, misuse, external provider failures, or force majeure events.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">4) Fraud Reporting and Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Fraud protection is a core priority. Stores may create internal fraud records and escalate high-risk cases to global review.
            Global escalation is subject to moderation, evidence review, and approval workflow.
          </p>
          <p className="text-sm text-muted-foreground">
            False reporting, harassment, or abuse of fraud systems is prohibited and may result in account restrictions, audit review, or removal from platform access.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">5) Rental Guide</h2>
          <p className="text-sm text-muted-foreground">
            Best-practice recommendations for store owners and staff:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
            {rentalGuideItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">6) Helps & FAQ</h2>
          <p className="text-sm text-muted-foreground">
            Open each question to view the answer.
          </p>
          <FaqAccordion items={faqItems} />
        </section>
      </div>
    </div>
  );
}
