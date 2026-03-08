import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileImage, FileText } from 'lucide-react';
import { formatPHP } from '@/src/lib/currency';
import { Button, Card } from '@/src/components/ui';
import { useAppStore } from '@/src/store';
import type { SubmittedApplication } from '@/src/types/domain';

interface SuccessPageProps {
  onBackHome: () => void;
}

export function SuccessPage({ onBackHome }: SuccessPageProps) {
  const { lastSubmittedApplication } = useAppStore();
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
      ...(displayedSubmission.customerEmergencyContact ? [`Emergency Contact: ${displayedSubmission.customerEmergencyContact}`] : []),
      `Billing Address: ${displayedSubmission.customerAddress}`,
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
    <div className="container mx-auto max-w-3xl py-12">
      <div className="mb-6 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-3xl font-bold">Application Submitted!</h1>
        <p className="text-muted-foreground">Your rental request was sent for store owner review.</p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-bold">Submitted Form Copy</h2>

        {displayedSubmission ? (
          <div className="space-y-3 text-sm">
            <p>Order ID: <span className="font-semibold">{displayedSubmission.orderId}</span></p>
            <p>Store: <span className="font-semibold">{displayedSubmission.storeName}</span></p>
            <p>Total Amount: <span className="font-semibold">{formatPHP(displayedSubmission.totalAmount)}</span></p>
            <p className="text-muted-foreground">Open detailed form to view all submitted fields and save your copy.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No local copy was found. You can still review your transaction in your account.</p>
        )}

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Save this into PDF or image/screenshot to keep your own copy for reference.
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setShowDetailModal(true)} disabled={!displayedSubmission}>
            <FileText className="mr-2 h-4 w-4" /> View Detailed Form
          </Button>
          <Button variant="outline" onClick={saveAsPdf}>
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
          <Button variant="outline" onClick={saveAsImage} disabled={!displayedSubmission}>
            <FileImage className="mr-2 h-4 w-4" /> Save as Image
          </Button>
          <Button onClick={onBackHome}>Back to Home</Button>
        </div>
      </Card>

      {showDetailModal && displayedSubmission && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold">Detailed Rental Application Form</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                &times;
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              {detailLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={saveAsPdf}>
                <Download className="mr-2 h-4 w-4" /> Save as PDF
              </Button>
              <Button variant="outline" onClick={saveAsImage}>
                <FileImage className="mr-2 h-4 w-4" /> Save as Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
