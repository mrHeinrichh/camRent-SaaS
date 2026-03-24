import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileImage, FileText, MapPin, Phone, ReceiptText, Store, Truck, User, ChevronRight, X, User2, Package, Mail, CreditCard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPHP } from '@/src/lib/currency';
import { Button, Card, cn } from '@/src/components/ui';
import { useAppStore } from '@/src/store';
import type { SubmittedApplication } from '@/src/types/domain';

interface SuccessPageProps {
  onBackHome: () => void;
  onOpenAccount?: () => void;
}

export function SuccessPage({ onBackHome, onOpenAccount }: SuccessPageProps) {
  const { lastSubmittedApplication, user } = useAppStore();
  const [showDetails, setShowDetails] = useState(false);
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
    <div className="min-h-[80vh] bg-[var(--tone-bg)] pb-24 pt-16">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--tone-text)]">Application Submitted!</h1>
          <p className="mt-3 text-lg font-medium text-[var(--tone-text-muted)]">Your rental request was successfully sent for store review.</p>
        </motion.div>

        <Card className="overflow-hidden rounded-[2.5rem] border border-white/60 bg-[var(--tone-surface)] p-0 shadow-2xl backdrop-blur-xl">
          <div className="bg-[var(--tone-accent)] p-6 text-[var(--tone-bg)] text-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Reference Number</p>
            <p className="mt-1 font-mono text-2xl font-black tracking-tighter">
              #{displayedSubmission?.orderId || 'N/A'}
            </p>
          </div>
          
          <div className="p-6 sm:p-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--tone-bg)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tone-bg)] text-[var(--tone-accent)]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Renting From</p>
                    <p className="text-sm font-bold text-[var(--tone-text)]">{displayedSubmission?.storeName || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Grand Total</p>
                  <p className="text-lg font-black text-[var(--tone-accent)]">{displayedSubmission ? formatPHP(displayedSubmission.totalAmount) : '-'}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--tone-accent)]/10 bg-emerald-50/20 p-4 text-center">
                <p className="text-sm font-bold text-emerald-800 flex items-center justify-center gap-2">
                   <ShieldCheck className="h-4 w-4" /> Submission is legally recorded.
                </p>
                {user?.role === 'renter' && (
                  <p className="mt-1 text-xs text-emerald-700/80">You can also track this in your account dashboard anytime.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button variant="outline" className={cn("h-14 rounded-2xl border-white/60 bg-white/40 font-black tracking-tight text-[var(--tone-text)] shadow-sm backdrop-blur-sm transition-all hover:bg-white/80", showDetails && "bg-[var(--tone-accent)] text-[var(--tone-bg)]")} onClick={() => setShowDetails(!showDetails)} disabled={!displayedSubmission}>
                  <FileText className="mr-2 h-5 w-5" /> {showDetails ? "Hide Details" : "Review Details"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-14 rounded-2xl border-white/60 bg-white/40 font-bold text-[var(--tone-text)] shadow-sm hover:bg-white/80" onClick={saveAsPdf}>
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="h-14 rounded-2xl border-white/60 bg-white/40 font-bold text-[var(--tone-text)] shadow-sm hover:bg-white/80" onClick={saveAsImage} disabled={!displayedSubmission}>
                    <FileImage className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showDetails && displayedSubmission && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-[var(--tone-bg)] space-y-10 pb-10">
                      <section>
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                          <User2 className="h-4 w-4" /> Personal & Logistics
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {[
                            { icon: User, label: 'Full Name', value: displayedSubmission.customerName },
                            { icon: Mail, label: 'Email', value: displayedSubmission.customerEmail },
                            { icon: Phone, label: 'Contact', value: displayedSubmission.customerPhone },
                            { icon: MapPin, label: 'Address', value: displayedSubmission.customerAddress },
                            { icon: Truck, label: 'Delivery', value: displayedSubmission.deliveryAddress || 'Pick-up' },
                            { icon: CreditCard, label: 'Payment', value: displayedSubmission.paymentMode },
                          ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-[var(--tone-bg)] bg-white/40 p-4 shadow-sm backdrop-blur-sm">
                              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--tone-text-muted)] mb-1">
                                <item.icon className="h-3 w-3" /> {item.label}
                              </p>
                              <p className="text-sm font-bold text-[var(--tone-text)] break-all">{item.value || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">
                          <Package className="h-4 w-4" /> Rented Gear
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {displayedSubmission.items.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="group overflow-hidden rounded-[1.5rem] border border-[var(--tone-bg)] bg-white/40 shadow-sm transition-all hover:shadow-md">
                              <img src={item.image_url || `https://picsum.photos/seed/success-${item.name}-${index}/240/240`} alt={item.name} className="h-24 sm:h-32 w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" />
                              <div className="p-3">
                                <p className="line-clamp-1 text-[10px] sm:text-xs font-black text-[var(--tone-text)]">{item.name}</p>
                                <p className="mt-0.5 text-[8px] sm:text-[10px] font-medium text-[var(--tone-text-muted)]">{item.startDate} &mdash; {item.endDate}</p>
                                <p className="mt-2 text-xs font-black text-[var(--tone-accent)]">{formatPHP(item.daily_price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {(displayedSubmission.billingAddressFileUrl || displayedSubmission.leaseAgreementSubmissionUrl) && (
                        <section>
                          <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)]">Documents</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {displayedSubmission.billingAddressFileUrl && (
                              <a href={displayedSubmission.billingAddressFileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[var(--tone-bg)]/40 p-4 text-sm font-bold hover:bg-[var(--tone-bg)] transition-colors">
                                <span className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" /> Billing Address
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-40" />
                              </a>
                            )}
                            {displayedSubmission.leaseAgreementSubmissionUrl && (
                              <a href={displayedSubmission.leaseAgreementSubmissionUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[var(--tone-bg)]/40 p-4 text-sm font-bold hover:bg-[var(--tone-bg)] transition-colors">
                                <span className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Signed Lease
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-40" />
                              </a>
                            )}
                          </div>
                        </section>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3 pt-4 border-t border-[var(--tone-bg)]">
                {user?.role === 'renter' && (
                  <Button className="h-14 w-full rounded-2xl bg-[var(--tone-surface-soft)] font-black text-[var(--tone-text)] hover:bg-[var(--tone-bg)] transition-all" onClick={onOpenAccount}>
                    Go to Account Dashboard
                  </Button>
                )}
                <Button className="h-14 w-full rounded-2xl bg-[var(--tone-accent)] font-black text-[var(--tone-bg)] shadow-lg hover:shadow-[var(--tone-accent)]/20 transition-all" onClick={onBackHome}>
                  Finish & Return Home
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
