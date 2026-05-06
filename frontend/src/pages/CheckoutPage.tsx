import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown, ClipboardList, CreditCard, Facebook, FileBadge2, FileText, Globe, Instagram, MapPin, Music2, Truck, User2, ShieldCheck, CheckCircle2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
import { getCartItemRentalTotal, getRentalBillingModeLabel, getRentalDayCount } from '@/src/lib/rentalPricing';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { RentalFormField, RentalFormSchemaResponse, Store, SubmittedApplication } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';
import { PhoneInput } from '@/src/components/PhoneInput';
import { validatePhone } from '@/src/lib/phone';

interface CheckoutPageProps {
  onComplete: () => void;
  onNavigate?: (page: AppPage) => void;
}

interface OrderCreateResponse {
  id: string;
}

interface UploadResponse {
  url: string;
}

interface IdRequirementsResponse {
  hasPreviousTransaction: boolean;
  requireIds: boolean;
}

export function CheckoutPage({ onComplete, onNavigate }: CheckoutPageProps) {
  const { cart, clearCart, user, setLastSubmittedApplication, appliedVoucher, setAppliedVoucher } = useAppStore();
  const [store, setStore] = useState<Store | null>(null);
  const [customFields, setCustomFields] = useState<RentalFormField[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [rentalFormSettings, setRentalFormSettings] = useState<{
    show_branch_map: boolean;
    reference_text: string;
    reference_image_url: string;
    reference_image_position: 'top' | 'mid';
  }>({
    show_branch_map: true,
    reference_text: '',
    reference_image_url: '',
    reference_image_position: 'top',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: user?.phone || '',
    emergencyContactName: '',
    emergencyContact: '',
    presentAddress: '',
    storeBranchId: '',
    deliveryMode: '',
    deliveryAddress: '',
    paymentMode: 'cash',
    agree: false,
  });

  const [billingAddressFile, setBillingAddressFile] = useState<File | null>(null);
  const [leaseAgreementSubmissionFile, setLeaseAgreementSubmissionFile] = useState<File | null>(null);
  const [idRequirements] = useState<IdRequirementsResponse>({ hasPreviousTransaction: false, requireIds: true });
  const [documentFiles, setDocumentFiles] = useState<{
    id1_front: File | null;
    id1_back: File | null;
    id2_front: File | null;
    id2_back: File | null;
    selfie_id: File | null;
  }>({
    id1_front: null,
    id1_back: null,
    id2_front: null,
    id2_back: null,
    selfie_id: null,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const cartWithBillingMode = useMemo(
    () =>
      cart.map((item) => ({
        ...item,
        rentalBillingMode: item.rentalBillingMode || store?.rental_billing_mode || 'twenty_four_hour',
      })),
    [cart, store?.rental_billing_mode],
  );
  const rentalSubtotal = useMemo(() => cartWithBillingMode.reduce((sum, item) => sum + getCartItemRentalTotal(item), 0), [cartWithBillingMode]);
  const finalSecurityDeposit = store?.security_deposit || 0;
  const voucherDiscount = appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? Math.max(0, Number(appliedVoucher.discount_amount || 0)) : 0;
  const totalAmount = Math.max(0, rentalSubtotal + finalSecurityDeposit - voucherDiscount);

  // Completion calculation for the mini progress bar
  const completion = useMemo(() => {
    const checks = [
      Boolean(formData.fullName.trim()),
      Boolean(formData.email.trim()),
      Boolean(formData.phone.trim()),
      Boolean(formData.emergencyContactName.trim()),
      Boolean(formData.emergencyContact.trim()),
      Boolean(formData.presentAddress.trim()),
      Boolean(formData.storeBranchId.trim() || store?.branches?.[0]?._id),
      Boolean(formData.deliveryMode.trim()),
      Boolean(formData.deliveryAddress.trim()),
      Boolean(formData.paymentMode.trim()),
      Boolean(billingAddressFile),
      Boolean(documentFiles.id1_front),
      Boolean(documentFiles.id1_back),
      Boolean(documentFiles.id2_front),
      Boolean(documentFiles.id2_back),
      Boolean(documentFiles.selfie_id),
      store?.lease_agreement_file_url ? Boolean(leaseAgreementSubmissionFile) : true,
      Boolean(formData.agree),
    ];
    const completed = checks.filter(Boolean).length;
    return {
      completed,
      total: checks.length,
      percent: Math.round((completed / Math.max(1, checks.length)) * 100),
    };
  }, [billingAddressFile, documentFiles, formData, leaseAgreementSubmissionFile, store]);

  useEffect(() => {
    if (!cart[0]?.store_id) {
      setLoadingStore(false);
      return;
    }

    setLoadingStore(true);
    api
      .get<Store>(`/api/stores/${cart[0].store_id}`)
      .then(async (storeData) => {
        setStore(storeData);
        try {
          const schema = await api.get<RentalFormSchemaResponse>(`/api/stores/${cart[0].store_id}/rental-form`);
          setCustomFields(schema.fields || []);
          setRentalFormSettings({
            show_branch_map: schema.settings?.show_branch_map !== false,
            reference_text: schema.settings?.reference_text || '',
            reference_image_url: schema.settings?.reference_image_url || '',
            reference_image_position: schema.settings?.reference_image_position === 'mid' ? 'mid' : 'top',
          });
        } catch {
          setCustomFields([]);
        }
        if (!formData.deliveryMode && storeData.delivery_modes?.length) {
          setFormData((prev) => ({ ...prev, deliveryMode: storeData.delivery_modes![0] }));
        } else if (!formData.deliveryMode) {
          setFormData((prev) => ({ ...prev, deliveryMode: 'Store Pickup' }));
        }
        if (!formData.storeBranchId && storeData.branches?.length) {
          setFormData((prev) => ({ ...prev, storeBranchId: String(storeData.branches?.[0]?._id || '') }));
        }
      })
      .finally(() => setLoadingStore(false));
  }, [cart]);

  const uploadPublicFile = async (file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    const uploadResult = await withTimeout(api.post<UploadResponse>('/api/upload/public/strict-cloudinary', uploadFormData), 45000, `Upload timed out for ${file.name}`);
    return uploadResult.url;
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const selectedBranch = useMemo(
    () =>
      (store?.branches?.length
        ? store.branches.find((branch) => String(branch._id) === formData.storeBranchId)
        : { _id: 'main', name: 'Main Branch', address: store?.address || '', location_lat: store?.location_lat, location_lng: store?.location_lng }) || null,
    [formData.storeBranchId, store],
  );

  const branchMapSrc = useMemo(() => {
    const lat = Number(selectedBranch?.location_lat);
    const lng = Number(selectedBranch?.location_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
    const delta = 0.015;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [selectedBranch]);

  const socialLinks = useMemo(() => {
    const rawStore = (store || {}) as Record<string, any>;
    const custom = Array.isArray(rawStore.custom_social_links) ? rawStore.custom_social_links : [];
    return {
      facebook: String(rawStore.facebook_url || '').trim(),
      instagram: String(rawStore.instagram_url || '').trim(),
      tiktok: String(rawStore.tiktok_url || '').trim(),
      custom: custom.map((entry: unknown) => String(entry || '').trim()).filter(Boolean),
    };
  }, [store]);

  const handleNextStep = () => {
    setFieldErrors({});

    if (currentStep === 1) {
      const errors: Record<string, string> = {};
      if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      if (!formData.phone.trim()) errors.phone = 'Contact Number is required';
      if (!formData.emergencyContactName.trim()) errors.emergencyContactName = 'Emergency Contact Name is required';
      if (!formData.emergencyContact.trim()) errors.emergencyContact = 'Emergency Contact Number is required';
      if (!formData.presentAddress.trim()) errors.presentAddress = 'Present Address is required';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      const phoneCheck = validatePhone(formData.phone);
      if (!phoneCheck.valid) {
        setFieldErrors({ phone: phoneCheck.error || 'Invalid phone number' });
        return;
      }
      const emergencyCheck = validatePhone(formData.emergencyContact);
      if (!emergencyCheck.valid) {
        setFieldErrors({ emergencyContact: emergencyCheck.error || 'Invalid phone number' });
        return;
      }

      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!formData.deliveryAddress.trim()) {
        setFieldErrors({ deliveryAddress: 'Delivery Address is required' });
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeSubmit = async () => {
    if (submittingApplication || !store) return;
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!billingAddressFile) errors.billingAddressFile = 'Billing Address File is required';
    if (!documentFiles.id1_front) errors.id1_front = 'Required';
    if (!documentFiles.id1_back) errors.id1_back = 'Required';
    if (!documentFiles.id2_front) errors.id2_front = 'Required';
    if (!documentFiles.id2_back) errors.id2_back = 'Required';
    if (!documentFiles.selfie_id) errors.selfie_id = 'Required';

    if (store.lease_agreement_file_url && !leaseAgreementSubmissionFile) {
      errors.leaseAgreementSubmissionFile = 'Completed lease agreement is required';
    }
    if (!formData.agree) {
      errors.agree = 'You must agree to the terms to proceed';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmittingApplication(true);
      const effectiveStoreBranchId = formData.storeBranchId || String(store.branches?.[0]?._id || 'main');

      let leaseAgreementSubmissionUrl = '';
      if (leaseAgreementSubmissionFile) {
        leaseAgreementSubmissionUrl = await uploadPublicFile(leaseAgreementSubmissionFile);
      }

      const billingAddressFileUrl = billingAddressFile ? await uploadPublicFile(billingAddressFile) : '';
      if (!billingAddressFileUrl) {
        setFieldErrors({ billingAddressFile: 'Failed to upload billing address file' });
        return;
      }

      const documentUrls: Record<string, string> = {};
      const docUploadTasks: Array<Promise<void>> = [];
      if (documentFiles.id1_front) docUploadTasks.push(uploadPublicFile(documentFiles.id1_front).then((url) => { documentUrls.id1_front = url; }));
      if (documentFiles.id1_back) docUploadTasks.push(uploadPublicFile(documentFiles.id1_back).then((url) => { documentUrls.id1_back = url; }));
      if (documentFiles.id2_front) docUploadTasks.push(uploadPublicFile(documentFiles.id2_front).then((url) => { documentUrls.id2_front = url; }));
      if (documentFiles.id2_back) docUploadTasks.push(uploadPublicFile(documentFiles.id2_back).then((url) => { documentUrls.id2_back = url; }));
      if (documentFiles.selfie_id) docUploadTasks.push(uploadPublicFile(documentFiles.selfie_id).then((url) => { documentUrls.selfie_id = url; }));
      await Promise.all(docUploadTasks);
      documentUrls.proof_of_billing = billingAddressFileUrl;

      const result = await withTimeout(
        api.post<OrderCreateResponse>('/api/orders', {
          store_id: cart[0].store_id,
          renter_name: formData.fullName,
          renter_email: formData.email,
          renter_phone: formData.phone,
          renter_emergency_contact_name: formData.emergencyContactName,
          renter_emergency_contact: formData.emergencyContact,
          renter_address: formData.presentAddress,
          store_branch_id: effectiveStoreBranchId,
          delivery_mode: formData.deliveryMode,
          delivery_address: formData.deliveryAddress,
          payment_mode: formData.paymentMode,
          lease_agreement_submission_url: leaseAgreementSubmissionUrl,
          custom_answers: customAnswers,
          document_urls: documentUrls,
          voucher_code: appliedVoucher?.store_id === cart[0].store_id ? appliedVoucher.code : '',
          items: cartWithBillingMode,
          total_amount: totalAmount,
        }),
        45000,
        'Application submission timed out. Please try again.',
      );

      const submittedApplication: SubmittedApplication = {
        orderId: result.id,
        submittedAt: new Date().toISOString(),
        storeName: store.name,
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerEmergencyContactName: formData.emergencyContactName,
        customerEmergencyContact: formData.emergencyContact,
        customerAddress: formData.presentAddress,
        billingAddressFileUrl,
        storeBranchId: effectiveStoreBranchId,
        storeBranchName: store.branches?.find((branch) => String(branch._id) === effectiveStoreBranchId)?.name || '',
        storeBranchAddress: store.branches?.find((branch) => String(branch._id) === effectiveStoreBranchId)?.address || store.address || '',
        deliveryMode: formData.deliveryMode,
        deliveryAddress: formData.deliveryAddress,
        paymentMode: formData.paymentMode,
        leaseAgreementSubmissionUrl,
        customAnswers,
        items: cartWithBillingMode.map((item) => ({
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '18:00',
          daily_price: item.daily_price,
          deposit_amount: item.deposit_amount,
          quantity: Math.max(1, item.quantity || 1),
          image_url: item.image_url,
          rentalBillingMode: item.rentalBillingMode,
        })),
        totalAmount,
      };

      setLastSubmittedApplication(submittedApplication);
      try {
        localStorage.setItem('camrent-last-submitted-application', JSON.stringify(submittedApplication));
      } catch { }

      clearCart();
      setAppliedVoucher(null);
      onComplete();
    } catch (error: any) {
      setFieldErrors({ submit: error.message || 'An error occurred during submission' });
    } finally {
      setSubmittingApplication(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (currentStep < 3) {
      handleNextStep();
    } else {
      executeSubmit();
    }
  };

  if (loadingStore) return <div className="container mx-auto max-w-2xl px-4 py-12 text-center text-[var(--tone-text-muted)]">Loading rental agreement...</div>;

  const steps = [
    { id: 1, name: 'Your Details', icon: User2 },
    { id: 2, name: 'Logistics', icon: Truck },
    { id: 3, name: 'Identity & Payment', icon: ShieldCheck },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--tone-text)]">Rental Agreement</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--tone-text-muted)]">A clean and secure 3-step process to submit your rental application.</p>
      </div>

      <div className="mb-10 w-full max-w-2xl mx-auto px-4">
        <div className="relative flex justify-between">
          {/* Background Track */}
          <div className="absolute left-6 right-6 top-6 -z-10 h-1 -translate-y-1/2 rounded-full bg-[var(--tone-border)]" />
          {/* Active Track */}
          <div
            className="absolute left-6 top-6 -z-10 h-1 -translate-y-1/2 rounded-full bg-[var(--tone-accent)] transition-all duration-500 ease-in-out"
            style={{ width: `calc(${(currentStep - 1) * 50}%)`, maxWidth: 'calc(100% - 48px)' }}
          />

          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const StepIcon = isCompleted ? CheckCircle2 : step.icon;

            // Glassmorphic node container
            // The border matches the app background `--tone-bg` to mask the line behind the circle flawlessly
            return (
              <div key={step.id} className="relative z-10 flex w-24 flex-col items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-[var(--tone-bg)] shadow-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--tone-accent)] text-[var(--tone-bg)] shadow-[var(--tone-accent)]/20'
                      : isCompleted
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--tone-surface-soft)] text-[var(--tone-text-muted)]'
                  }`}
                >
                  <StepIcon className="h-[18px] w-[18px]" />
                </div>
                <span
                  className={`text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-[var(--tone-accent)]' : isCompleted ? 'text-[var(--color-primary)]' : 'text-[var(--tone-text-muted)]'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-[var(--tone-accent)] bg-[var(--tone-surface)] px-4 py-3 text-sm text-[var(--tone-text)] shadow-sm">
                {!user && onNavigate && (
                  <p>
                    <button type="button" className="font-semibold underline hover:text-[var(--tone-accent)]" onClick={() => onNavigate('login')}>Login</button> so your transaction perfectly saves in your account history.
                  </p>
                )}
                <p>All fields accurately matching your Valid IDs are required to pass store verification.</p>
              </div>

              <Card className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <h2 className="mb-6 inline-flex items-center gap-2 text-lg font-bold text-[var(--tone-text)]">
                  <User2 className="h-5 w-5 text-[var(--tone-accent)]" /> Applicant Information
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Input label="Full Name" icon={<User2 className="h-4 w-4" />} required value={formData.fullName} onChange={(e) => { setFormData({ ...formData, fullName: e.target.value }); clearFieldError('fullName'); }} placeholder="John Doe" error={fieldErrors.fullName} />
                  </div>
                  <div className="space-y-2">
                    <PhoneInput label="Contact Number" value={formData.phone} required onChange={(val) => { setFormData({ ...formData, phone: val }); clearFieldError('phone'); }} error={fieldErrors.phone} />
                  </div>
                  <div className="space-y-2">
                    <Input label="Emergency Contact Name" icon={<User2 className="h-4 w-4" />} required value={formData.emergencyContactName} onChange={(e) => { setFormData({ ...formData, emergencyContactName: e.target.value }); clearFieldError('emergencyContactName'); }} placeholder="Jane Doe" error={fieldErrors.emergencyContactName} />
                  </div>
                  <div className="space-y-2">
                    <PhoneInput label="Emergency Contact Number" value={formData.emergencyContact} required onChange={(val) => { setFormData({ ...formData, emergencyContact: val }); clearFieldError('emergencyContact'); }} error={fieldErrors.emergencyContact} />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Input label="Email Address" icon={<Mail className="h-4 w-4" />} type="email" required value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearFieldError('email'); }} disabled={Boolean(user?.email)} placeholder="you@example.com" error={fieldErrors.email} />
                </div>

                <div className="mt-5 space-y-2">
                  <Input label="Present Address" icon={<MapPin className="h-4 w-4" />} required value={formData.presentAddress} onChange={(e) => { setFormData({ ...formData, presentAddress: e.target.value }); clearFieldError('presentAddress'); }} placeholder="123 Main St, City, Province" error={fieldErrors.presentAddress} />
                </div>
              </Card>

              <div className="flex justify-end">
                <Button type="button" className="h-11 px-8 rounded-full shadow-sm" onClick={handleNextStep}>
                  Next: Delivery & Logistics <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && store && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <h2 className="mb-6 inline-flex items-center gap-2 text-lg font-bold text-[var(--tone-text)]">
                  <MapPin className="h-5 w-5 text-[var(--tone-accent)]" /> Store & Logistics
                </h2>
                <div className="mb-6 space-y-2 rounded-2xl border border-[var(--tone-accent)] bg-[var(--tone-surface)] p-5 shadow-sm">
                  <p className="font-bold text-[var(--tone-text)]">{store.name}</p>
                  <p className="text-sm text-[var(--tone-text-muted)]">{store.address}</p>
                  <div className="mt-3 flex gap-3 text-[var(--tone-accent)]">
                    {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer"><Facebook className="h-4 w-4 transition-colors hover:text-[var(--color-primary)]" /></a>}
                    {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer"><Instagram className="h-4 w-4 transition-colors hover:text-[var(--color-primary)]" /></a>}
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--tone-text)]">Select Store Branch</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><MapPin className="h-4 w-4" /></div>
                      <select className="flex h-12 w-full appearance-none rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] pl-11 pr-10 text-[var(--tone-text)] text-sm shadow-sm outline-none transition-all focus:border-[var(--tone-accent)] focus:bg-[var(--tone-surface)] focus:ring-4 focus:ring-[var(--tone-accent)]/20" value={formData.storeBranchId} onChange={(e) => setFormData({ ...formData, storeBranchId: e.target.value })} required>
                        {(store?.branches?.length ? store.branches : [{ _id: 'main', address: store?.address || 'Main Store' }]).map((branch) => (
                          <option key={String(branch._id || branch.address)} value={String(branch._id || 'main')}>
                            {branch.name ? `${branch.name} - ` : ''} {branch.address}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><ChevronDown className="h-4 w-4" /></div>
                    </div>
                  </div>

                  {rentalFormSettings.show_branch_map && branchMapSrc && (
                    <div className="space-y-2">
                      <iframe title="Map" src={branchMapSrc} className="h-56 w-full rounded-2xl border-[4px] border-white shadow-sm" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                    </div>
                  )}

                  {rentalFormSettings.reference_text && (
                    <div className="rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] p-5 text-sm text-[var(--tone-text)] shadow-sm">
                      <p className="mb-2 flex items-center gap-2 font-bold text-[var(--tone-text)]"><FileText className="h-4 w-4" /> Store Notes</p>
                      <p className="whitespace-pre-line leading-relaxed">{rentalFormSettings.reference_text}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--tone-text)]">Preferred Delivery Mode</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><Truck className="h-4 w-4" /></div>
                      <select className="flex h-12 w-full appearance-none rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] pl-11 pr-10 text-[var(--tone-text)] text-sm shadow-sm outline-none transition-all focus:border-[var(--tone-accent)] focus:bg-[var(--tone-surface)] focus:ring-4 focus:ring-[var(--tone-accent)]/20" value={formData.deliveryMode} onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value })}>
                        {(store?.delivery_modes?.length ? store.delivery_modes : ['Store Pickup']).map((mode) => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><ChevronDown className="h-4 w-4" /></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input label="Delivery Address" icon={<MapPin className="h-4 w-4" />} required value={formData.deliveryAddress} onChange={(e) => { setFormData({ ...formData, deliveryAddress: e.target.value }); clearFieldError('deliveryAddress'); }} placeholder="Provide full address or specific meetup location." error={fieldErrors.deliveryAddress} />
                  </div>
                </div>
              </Card>

              <div className="flex justify-between px-2">
                <Button type="button" variant="outline" className="h-12 rounded-full border-[var(--tone-border)] bg-white/60 px-6 font-bold text-[var(--tone-text)] shadow-sm backdrop-blur-sm transition-all hover:bg-white/80" onClick={prevStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button type="button" className="h-12 rounded-full bg-[var(--tone-accent)] px-8 font-bold text-[var(--tone-bg)] shadow-md transition-all hover:bg-[var(--tone-accent)]/90" onClick={handleNextStep}>
                  Next: Payment <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-md sm:p-8">
                <h2 className="mb-6 inline-flex items-center gap-2 text-lg font-bold text-[var(--tone-text)]">
                  <CreditCard className="h-5 w-5 text-[var(--tone-accent)]" /> Identity & Verification
                </h2>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-[var(--tone-accent)] bg-[var(--tone-surface)] p-5 shadow-sm">
                    <p className="mb-2 text-sm font-bold text-[var(--tone-text)]">Required Identification Files</p>
                    <p className="mb-5 text-sm leading-relaxed text-[var(--tone-text-muted)]">Please upload 2 valid IDs (Front and Back) and a clear selfie of you holding one of the IDs.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FileUpload label="ID 1 Front" accept="image/*,.pdf" required file={documentFiles.id1_front} onChange={(files) => { setDocumentFiles((prev) => ({ ...prev, id1_front: files?.[0] ?? null })); clearFieldError('id1_front'); }} error={fieldErrors.id1_front} />
                      <FileUpload label="ID 1 Back" accept="image/*,.pdf" required file={documentFiles.id1_back} onChange={(files) => { setDocumentFiles((prev) => ({ ...prev, id1_back: files?.[0] ?? null })); clearFieldError('id1_back'); }} error={fieldErrors.id1_back} />
                      <FileUpload label="ID 2 Front" accept="image/*,.pdf" required file={documentFiles.id2_front} onChange={(files) => { setDocumentFiles((prev) => ({ ...prev, id2_front: files?.[0] ?? null })); clearFieldError('id2_front'); }} error={fieldErrors.id2_front} />
                      <FileUpload label="ID 2 Back" accept="image/*,.pdf" required file={documentFiles.id2_back} onChange={(files) => { setDocumentFiles((prev) => ({ ...prev, id2_back: files?.[0] ?? null })); clearFieldError('id2_back'); }} error={fieldErrors.id2_back} />
                      <div className="sm:col-span-2">
                        <FileUpload label="Selfie with ID" accept="image/*,.pdf" required file={documentFiles.selfie_id} onChange={(files) => { setDocumentFiles((prev) => ({ ...prev, selfie_id: files?.[0] ?? null })); clearFieldError('selfie_id'); }} error={fieldErrors.selfie_id} />
                      </div>
                    </div>
                  </div>

                  <FileUpload label="Billing Address Document" accept="image/*,.pdf" required file={billingAddressFile} onChange={(files) => { setBillingAddressFile(files?.[0] ?? null); clearFieldError('billingAddressFile'); }} helperText="Upload a recent utility bill to verify your address." error={fieldErrors.billingAddressFile} />

                  {store?.lease_agreement_file_url && (
                    <FileUpload label="Completed Lease Agreement" accept=".pdf,.doc,.docx,.png,.jpg" required file={leaseAgreementSubmissionFile} onChange={(files) => { setLeaseAgreementSubmissionFile(files?.[0] ?? null); clearFieldError('leaseAgreementSubmissionFile'); }} helperText="Download the template from store, fill it, and upload here." error={fieldErrors.leaseAgreementSubmissionFile} />
                  )}
                </div>
              </Card>

              {customFields.length > 0 && (
                <Card className="rounded-3xl border border-white/60 bg-white/40 p-6 shadow-xl backdrop-blur-md sm:p-8">
                  <h3 className="mb-4 inline-flex items-center gap-2 font-bold text-[var(--tone-text)]">
                    <FileBadge2 className="h-5 w-5 text-[var(--tone-accent)]" /> Additional Store Requirements
                  </h3>
                  <div className="grid gap-4">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-xs font-bold text-[var(--tone-text)]">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea required={field.required} value={customAnswers[field.id] || ''} onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.placeholder || ''} className="min-h-[80px] w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-4 py-3 text-[var(--tone-text)] text-sm shadow-sm transition-all focus-within:bg-[var(--tone-surface)] focus-within:ring-4 focus-within:ring-[var(--tone-accent)]/20 placeholder:text-[var(--tone-text-muted)] focus-visible:border-[var(--tone-accent)] focus-visible:outline-none" />
                        ) : field.type === 'select' ? (
                          <div className="relative">
                            <select required={field.required} value={customAnswers[field.id] || ''} onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))} className="flex h-12 w-full appearance-none rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] pl-4 pr-10 text-[var(--tone-text)] text-sm shadow-sm outline-none transition-all focus:border-[var(--tone-accent)] focus:bg-[var(--tone-surface)] focus:ring-4 focus:ring-[var(--tone-accent)]/20">
                              <option value="">Select option</option>
                              {(field.options || []).map((o) => (<option key={o} value={o}>{o}</option>))}
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><ChevronDown className="h-4 w-4" /></div>
                          </div>
                        ) : (
                          <Input required={field.required} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={customAnswers[field.id] || ''} onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.placeholder || ''} />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="rounded-3xl border border-white/60 bg-[var(--tone-surface-soft)] p-6 shadow-xl backdrop-blur-md sm:p-8">
                <div className="mb-8 space-y-3">
                  <label className="mb-4 block text-sm font-bold text-[var(--tone-text)]">Rented Items</label>
                  <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-950">
                    This shop uses {getRentalBillingModeLabel(cartWithBillingMode[0]?.rentalBillingMode)} for rental billing.
                  </p>
                  {cartWithBillingMode.map((item) => (
                    <div key={`${item.id}-${item.startDate}-${item.startTime || ''}-${item.endDate}-${item.endTime || ''}`} className="flex items-center gap-5 rounded-2xl border border-[var(--tone-border)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--tone-bg)] shadow-inner">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--tone-text-muted)]"><ClipboardList className="h-8 w-8 opacity-50" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-[var(--tone-text)]">{item.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[var(--tone-text-muted)] opacity-80">{new Date(item.startDate).toLocaleDateString()} {item.startTime || '09:00'} &mdash; {new Date(item.endDate).toLocaleDateString()} {item.endTime || '18:00'}</p>
                        <p className="mt-2 font-black text-[var(--tone-accent)]">{formatPHP(getCartItemRentalTotal(item))} <span className="text-xs font-normal text-[var(--tone-text-muted)]">({formatPHP(item.daily_price)} x {getRentalDayCount(item)} billing day{getRentalDayCount(item) === 1 ? '' : 's'} by {getRentalBillingModeLabel(item.rentalBillingMode)} x {Math.max(1, item.quantity || 1)} qty)</span></p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="mb-3 block text-sm font-bold text-[var(--tone-text)]">Payment Mode</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><CreditCard className="h-4 w-4" /></div>
                    <select className="flex h-12 w-full appearance-none rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] pl-11 pr-10 text-[var(--tone-text)] text-sm font-medium shadow-sm outline-none transition-all focus:border-[var(--tone-accent)] focus:bg-[var(--tone-surface)] focus:ring-4 focus:ring-[var(--tone-accent)]/20" value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                      <option value="cash">Cash on Pickup</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="gcash">GCash</option>
                      <option value="card">Credit/Debit Card</option>
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)]"><ChevronDown className="h-4 w-4" /></div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-[var(--tone-accent)] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between text-sm font-bold text-[var(--tone-text-muted)]">
                    <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Security Deposit</span>
                    <span className="text-[var(--tone-text)]">{formatPHP(finalSecurityDeposit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-[var(--tone-text-muted)]">
                    <span className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Rental Fee ({cart.length} items)</span>
                    <span className="text-[var(--tone-text)]">{formatPHP(rentalSubtotal)}</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm font-black text-emerald-600">
                      <span>Voucher Discount</span>
                      <span>-{formatPHP(voucherDiscount)}</span>
                    </div>
                  )}
                  <div className="my-1 h-[2px] w-full bg-[var(--tone-bg)] rounded-full" />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--tone-text-muted)] opacity-60">Total Due</span>
                    <span className="text-3xl font-black tracking-tight text-[var(--tone-text)]">{formatPHP(totalAmount)}</span>
                  </div>
                </div>

                  <div className="mt-8">
                    <div className="flex items-start gap-4 rounded-3xl border border-[var(--tone-border)] bg-white p-5 shadow-sm">
                      <button type="button" className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${formData.agree ? 'bg-emerald-500' : 'bg-[var(--tone-border)]'}`} onClick={() => { setFormData({ ...formData, agree: !formData.agree }); clearFieldError('agree'); }}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formData.agree ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <p className="text-xs leading-relaxed text-[var(--tone-text-muted)]">
                        I agree to the <button type="button" className="font-bold underline hover:text-[var(--tone-text)]" onClick={() => onNavigate?.('policies')}>Policies and Terms & Conditions</button>. My application will be legally submitted for the store owner's review.
                      </p>
                    </div>
                    {fieldErrors.agree && <p className="mt-2 ml-1 text-xs font-bold text-red-500 animate-fade-up">{fieldErrors.agree}</p>}
                    {fieldErrors.submit && <p className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600 border border-red-100">{fieldErrors.submit}</p>}
                  </div>
              </Card>

              <div className="flex items-center justify-between px-2">
                <Button type="button" variant="outline" className="h-12 rounded-full border-[var(--tone-border)] bg-white/60 px-6 font-bold text-[var(--tone-text)] shadow-sm backdrop-blur-sm transition-all hover:bg-white/80" onClick={prevStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="h-12 rounded-full bg-[var(--tone-accent)] px-8 font-bold text-[var(--tone-bg)] shadow-md transition-all hover:bg-[var(--tone-accent)]/90" disabled={submittingApplication || !formData.agree}>
                  {submittingApplication ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {submittingApplication && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--tone-image-overlay)]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-[var(--tone-surface)]/80 p-8 text-center text-[var(--tone-text)] shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--tone-border)] border-t-[var(--tone-accent)]"></div>
            <p className="text-lg font-bold">Uploading Documents...</p>
            <p className="mt-2 text-sm text-[var(--tone-text-muted)]">Please do not close this window.</p>
          </div>
        </div>
      )}
    </div>
  );
}
