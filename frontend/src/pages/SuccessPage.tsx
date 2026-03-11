import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileImage, FileText, MapPin, Phone, ReceiptText, Store, Truck, User } from 'lucide-react';
import { formatPHP } from '@/src/lib/currency';
import { Button, Card } from '@/src/components/ui';
import { useAppStore } from '@/src/store';
import type { SubmittedApplication } from '@/src/types/domain';

interface SuccessPageProps {
  onBackHome: () => void;
  onOpenAccount?: () => void;
}

export function SuccessPage({ onBackHome, onOpenAccount }: SuccessPageProps) {
  const { lastSubmittedApplication, user } = useAppStore();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fallbackSubmission] = useState<SubmittedApplication | null>(() => {
    try {
      const raw = localStorage.getItem('camrent-last-submitted-application');
      if (!raw) return null;
      return JSON.parse(raw) as SubmittedApplication;
    } catch {
      return null;
    }
  });
  const displayedSubmission = lastSubmittedApplication || fallbackSubmission;

  const detailLines = useMemo(() => {
    if (!displayedSubmission) return [];
    return [
      `Order ID: ${displayedSubmission.orderId}`,
      `Submitted At: ${new Date(displayedSubmission.submittedAt).toLocaleString()}`,
      `Store: ${displayedSubmission.storeName}`,
      `Customer: ${displayedSubmission.customerName}`,
      `Email: ${displayedSubmission.customerEmail}`,
      `Phone: ${displayedSubmission.customerPhone}`,
      ...(displayedSubmission.customerEmergencyContactName ? [`Emergency Contact Name: ${displayedSubmission.customerEmergencyContactName}`] : []),
      ...(displayedSubmission.customerEmergencyContact ? [`Emergency Contact: ${displayedSubmission.customerEmergencyContact}`] : []),
      `Present Address: ${displayedSubmission.customerAddress}`,
      ...(displayedSubmission.billingAddressFileUrl ? [`Billing Address File: ${displayedSubmission.billingAddressFileUrl}`] : []),
      ...(displayedSubmission.storeBranchName ? [`Branch: ${displayedSubmission.storeBranchName}`] : []),
      ...(displayedSubmission.storeBranchAddress ? [`Branch Address: ${displayedSubmission.storeBranchAddress}`] : []),
      `Delivery Mode: ${displayedSubmission.deliveryMode}`,
      `Delivery Address: ${displayedSubmission.deliveryAddress}`,
      `Payment Mode: ${displayedSubmission.paymentMode}`,
      ...(displayedSubmission.leaseAgreementSubmissionUrl ? [`Lease File: ${displayedSubmission.leaseAgreementSubmissionUrl}`] : []),
      'Items:',
      ...displayedSubmission.items.map(
        (item) => `- ${item.name} (${item.startDate} to ${item.endDate}) - ${formatPHP(item.daily_price)}`,
      ),
      `Total Amount: ${formatPHP(displayedSubmission.totalAmount)}`,
    ];
  }, [displayedSubmission]);

  const summaryCards = useMemo(() => {
    if (!displayedSubmission) return [];
    return [
      { icon: ReceiptText, label: 'Order ID', value: displayedSubmission.orderId },
      { icon: Store, label: 'Store', value: displayedSubmission.storeName },
      { icon: User, label: 'Customer', value: displayedSubmission.customerName },
      { icon: Phone, label: 'Contact', value: displayedSubmission.customerPhone },
      { icon: MapPin, label: 'Present Address', value: displayedSubmission.customerAddress },
      { icon: Truck, label: 'Delivery Address', value: displayedSubmission.deliveryAddress },
    ];
  }, [displayedSubmission]);

  const saveAsPdf = () => {
    window.print();
  };

  const saveAsImage = () => {
    if (!detailLines.length) return;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const lineHeight = 36;
    const padding = 60;
    const height = Math.max(900, padding * 2 + lineHeight * (detailLines.length + 3));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('CamRent Rental Application Copy', padding, 80);
    ctx.font = '22px Arial';

    let y = 140;
    for (const line of detailLines) {
      ctx.fillText(line, padding, y);
      y += lineHeight;
    }

    ctx.fillStyle = '#92400e';
    ctx.font = '20px Arial';
    ctx.fillText('Save this copy for your own reference.', padding, height - 50);

    const link = document.createElement('a');
    link.download = `camrent-application-${displayedSubmission?.orderId || 'copy'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">Application Submitted</h1>
        <p className="text-sm text-slate-500">Your rental request was sent for store owner review.</p>
      </div>

      <Card className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Submitted Form Copy</h2>

        {displayedSubmission ? (
          <div className="space-y-3 text-sm">
            <p>Order ID: <span className="font-semibold">{displayedSubmission.orderId}</span></p>
            <p>Store: <span className="font-semibold">{displayedSubmission.storeName}</span></p>
            <p>Total Amount: <span className="font-semibold">{formatPHP(displayedSubmission.totalAmount)}</span></p>
            <p className="text-muted-foreground">Open detailed form to view all submitted fields and save your copy.</p>
            {user?.role === 'renter' ? <p className="text-xs text-emerald-700">This submission is also saved in your account history.</p> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No local copy was found. You can still review your transaction in your account.</p>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Save this into PDF or image/screenshot to keep your own copy for reference.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-full" onClick={() => setShowDetailModal(true)} disabled={!displayedSubmission}>
            <FileText className="mr-2 h-4 w-4" /> View Detailed Form
          </Button>
          <Button variant="outline" className="rounded-full" onClick={saveAsPdf}>
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
          <Button variant="outline" className="rounded-full" onClick={saveAsImage} disabled={!displayedSubmission}>
            <FileImage className="mr-2 h-4 w-4" /> Save as Image
          </Button>
          {user?.role === 'renter' ? (
            <Button variant="outline" className="rounded-full" onClick={onOpenAccount}>
              View in My Account
            </Button>
          ) : null}
          <Button className="rounded-full" onClick={onBackHome}>Back to Home</Button>
        </div>
      </Card>

      {showDetailModal && displayedSubmission && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Detailed Rental Application Form</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                &times;
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <card.icon className="h-3 w-3" /> {card.label}
                  </p>
                  <p className="text-sm font-medium">{card.value || '-'}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-medium">
                  {displayedSubmission.customerEmergencyContactName || '-'} {displayedSubmission.customerEmergencyContact ? `(${displayedSubmission.customerEmergencyContact})` : ''}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Mode</p>
                <p className="text-sm font-medium">{displayedSubmission.paymentMode || '-'}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing Address File</p>
                {displayedSubmission.billingAddressFileUrl ? (
                  <a href={displayedSubmission.billingAddressFileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline">
                    View Billing Address File
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No billing file attached.</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lease File</p>
                {displayedSubmission.leaseAgreementSubmissionUrl ? (
                  <a href={displayedSubmission.leaseAgreementSubmissionUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline">
                    View Lease Agreement Submission
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No lease file attached.</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">Rented Gear Images</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {displayedSubmission.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={item.image_url || `https://picsum.photos/seed/success-${item.name}-${index}/240/240`} alt={item.name} className="h-24 w-full object-cover" />
                    <div className="space-y-0.5 px-2 py-1 text-xs">
                      <p className="line-clamp-1 font-medium">{item.name}</p>
                      <p className="text-muted-foreground">{item.startDate} to {item.endDate}</p>
                      <p className="text-muted-foreground">{formatPHP(item.daily_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipt Notes</p>
              <div className="space-y-1 text-sm">
                {detailLines.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={saveAsPdf}>
                <Download className="mr-2 h-4 w-4" /> Save as PDF
              </Button>
              <Button variant="outline" className="rounded-full" onClick={saveAsImage}>
                <FileImage className="mr-2 h-4 w-4" /> Save as Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
