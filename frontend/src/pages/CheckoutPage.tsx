import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CircleCheck, ClipboardList, CreditCard, Facebook, FileBadge2, FileText, Globe, Instagram, Mail, MapPin, Music2, Phone, Truck, User2 } from 'lucide-react';
import { api } from '@/src/lib/api';
import { formatPHP } from '@/src/lib/currency';
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

  const rentalSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.daily_price * Math.max(1, item.quantity || 1), 0), [cart]);
  const finalSecurityDeposit = store?.security_deposit || 0;
  const voucherDiscount = appliedVoucher && appliedVoucher.store_id === cart[0]?.store_id ? Math.max(0, Number(appliedVoucher.discount_amount || 0)) : 0;
  const totalAmount = Math.max(0, rentalSubtotal + finalSecurityDeposit - voucherDiscount);
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
    const total = checks.length;
    return {
      completed,
      total,
      percent: Math.round((completed / Math.max(1, total)) * 100),
    };
  }, [billingAddressFile, documentFiles.id1_back, documentFiles.id1_front, documentFiles.id2_back, documentFiles.id2_front, documentFiles.selfie_id, formData.agree, formData.deliveryAddress, formData.deliveryMode, formData.email, formData.emergencyContact, formData.emergencyContactName, formData.fullName, formData.paymentMode, formData.phone, formData.presentAddress, formData.storeBranchId, leaseAgreementSubmissionFile, store?.branches, store?.lease_agreement_file_url]);

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
          setRentalFormSettings({
            show_branch_map: true,
            reference_text: '',
            reference_image_url: '',
            reference_image_position: 'top',
          });
        }
        if (!formData.deliveryMode && storeData.delivery_modes?.length) {
          setFormData((previous) => ({ ...previous, deliveryMode: storeData.delivery_modes![0] }));
        } else if (!formData.deliveryMode) {
          setFormData((previous) => ({ ...previous, deliveryMode: 'Store Pickup' }));
        }
        if (!formData.storeBranchId && storeData.branches?.length) {
          setFormData((previous) => ({ ...previous, storeBranchId: String(storeData.branches?.[0]?._id || '') }));
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
    const deltaLng = 0.015;
    const deltaLat = 0.01;
    const minLng = Math.max(-180, lng - deltaLng);
    const maxLng = Math.min(180, lng + deltaLng);
    const minLat = Math.max(-90, lat - deltaLat);
    const maxLat = Math.min(90, lat + deltaLat);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [selectedBranch]);
  const socialLinks = useMemo(() => {
    const rawStore = (store || {}) as Record<string, any>;
    const custom = Array.isArray(rawStore.custom_social_links)
      ? rawStore.custom_social_links
      : Array.isArray(rawStore.customSocialLinks)
        ? rawStore.customSocialLinks
        : [];
    return {
      facebook: String(rawStore.facebook_url || '').trim(),
      instagram: String(rawStore.instagram_url || '').trim(),
      tiktok: String(rawStore.tiktok_url ?? rawStore.tiktokUrl ?? '').trim(),
      custom: custom.map((entry: unknown) => String(entry || '').trim()).filter(Boolean),
    };
  }, [store]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingApplication) return;
    if (!store) return alert('Store details are not available. Please try again.');
    const effectiveStoreBranchId = formData.storeBranchId || String(store.branches?.[0]?._id || 'main');
    const missingFields: string[] = [];
    if (!formData.fullName.trim()) missingFields.push('Full Name');
    if (!formData.email.trim()) missingFields.push('Email');
    if (!formData.phone.trim()) missingFields.push('Contact Number');
    if (!formData.emergencyContactName.trim()) missingFields.push('Emergency Contact Name');
    if (!formData.emergencyContact.trim()) missingFields.push('Emergency Contact Number');
    if (!formData.presentAddress.trim()) missingFields.push('Present Address');
    if (!billingAddressFile) missingFields.push('Billing Address File');
    if (!effectiveStoreBranchId.trim()) missingFields.push('Store Branch');
    if (!formData.deliveryMode.trim()) missingFields.push('Delivery Mode');
    if (!formData.deliveryAddress.trim()) missingFields.push('Delivery Address');
    if (!formData.paymentMode.trim()) missingFields.push('Payment Mode');
    if (missingFields.length) {
      return alert(`Please complete all required fields: ${missingFields.join(', ')}`);
    }
    if (!formData.agree) return alert('Please agree to the terms');
    const phoneCheck = validatePhone(formData.phone);
    if (!phoneCheck.valid) return alert(phoneCheck.error);
    const emergencyCheck = validatePhone(formData.emergencyContact);
    if (!emergencyCheck.valid) return alert(emergencyCheck.error);
    if (store.lease_agreement_file_url && !leaseAgreementSubmissionFile) return alert('Please upload your completed lease agreement file.');
    if (!documentFiles.id1_front || !documentFiles.id1_back || !documentFiles.id2_front || !documentFiles.id2_back || !documentFiles.selfie_id) {
      return alert('2 valid IDs (both front and back) and selfie with ID are required.');
    }

    try {
      setSubmittingApplication(true);
      let leaseAgreementSubmissionUrl = '';
      if (leaseAgreementSubmissionFile) {
        leaseAgreementSubmissionUrl = await uploadPublicFile(leaseAgreementSubmissionFile);
      }

      const billingAddressFileUrl = billingAddressFile ? await uploadPublicFile(billingAddressFile) : '';
      if (!billingAddressFileUrl) {
        return alert('Billing address file is required.');
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
          items: cart,
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
        billingAddressFileUrl: billingAddressFileUrl,
        storeBranchId: effectiveStoreBranchId,
        storeBranchName: store.branches?.find((branch) => String(branch._id) === effectiveStoreBranchId)?.name || '',
        storeBranchAddress: store.branches?.find((branch) => String(branch._id) === effectiveStoreBranchId)?.address || store.address || '',
        deliveryMode: formData.deliveryMode,
        deliveryAddress: formData.deliveryAddress,
        paymentMode: formData.paymentMode,
        leaseAgreementSubmissionUrl,
        customAnswers,
        items: cart.map((item) => ({
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          daily_price: item.daily_price,
          deposit_amount: item.deposit_amount,
          quantity: Math.max(1, item.quantity || 1),
          image_url: item.image_url,
        })),
        totalAmount,
      };

      setLastSubmittedApplication(submittedApplication);
      try {
        localStorage.setItem('camrent-last-submitted-application', JSON.stringify(submittedApplication));
      } catch {
        // best-effort guest fallback only
      }

      clearCart();
      setAppliedVoucher(null);
      onComplete();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmittingApplication(false);
    }
  };

  if (loadingStore) return <div className="container mx-auto max-w-2xl px-4 py-12">Loading store details...</div>;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Card className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CamRent PH</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Rental Agreement</h1>
          <p className="mt-2 text-sm text-slate-500">A clean and secure way to submit your rental application.</p>
        </div>
        <Card className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4" /> Application Progress
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {completion.completed}/{completion.total} completed
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Fill each section below. Required uploads and agreement are included in progress.</p>
        </Card>

        {store && (
          <Card className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">{store.name}</h2>
            <p className="text-sm text-muted-foreground">{store.address}</p>
            {(socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.custom.length) ? (
              <div className="space-y-2 text-sm">
                {socialLinks.facebook ? (
                  <p className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                    <Facebook className="h-4 w-4 shrink-0 text-blue-600" />
                    <a className="underline" href={socialLinks.facebook} target="_blank" rel="noreferrer">
                      {socialLinks.facebook}
                    </a>
                  </p>
                ) : null}
                {socialLinks.instagram ? (
                  <p className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                    <Instagram className="h-4 w-4 shrink-0 text-pink-600" />
                    <a className="underline" href={socialLinks.instagram} target="_blank" rel="noreferrer">
                      {socialLinks.instagram}
                    </a>
                  </p>
                ) : null}
                {socialLinks.tiktok ? (
                  <p className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                    <Music2 className="h-4 w-4 shrink-0 text-slate-900" />
                    <a className="underline" href={socialLinks.tiktok} target="_blank" rel="noreferrer">
                      {socialLinks.tiktok}
                    </a>
                  </p>
                ) : null}
                {socialLinks.custom.map((link, index) => (
                  <p key={`checkout-custom-social-${index}`} className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
                    <Globe className="h-4 w-4 shrink-0 text-slate-600" />
                    <a className="underline" href={link} target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  </p>
                ))}
              </div>
            ) : null}
            {store.payment_details && (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4" /> Payment Details (Customer Reference)
                </p>
                <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <p className="whitespace-pre-line">{store.payment_details}</p>
                </div>
              </div>
            )}
            {(store.payment_detail_images || []).length ? (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" /> Payment QR / Reference Images
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(store.payment_detail_images || []).map((url, index) => (
                    <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border bg-muted/20 p-2">
                      <div className="flex h-40 items-center justify-center overflow-hidden rounded bg-background">
                        <img src={url} alt={`Payment reference ${index + 1}`} className="h-full w-full object-contain" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4" /> Delivery Modes
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                {(store.delivery_modes?.length ? store.delivery_modes : ['Store Pickup']).map((mode) => (
                  <li key={mode}>{mode}</li>
                ))}
              </ul>
            </div>
            {store.branches?.length ? (
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4" /> Store Branches
                </p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  {store.branches.map((branch) => (
                    <li key={branch._id || branch.address}>
                      {branch.name ? `${branch.name} - ` : ''}
                      {branch.address}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="flex items-center justify-between">
                <span>Final Security Deposit</span>
                <span className="font-semibold text-slate-900">{formatPHP(finalSecurityDeposit)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Rental Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPHP(rentalSubtotal)}</span>
              </p>
              {voucherDiscount > 0 ? (
                <p className="flex items-center justify-between text-emerald-700">
                  <span>Voucher Discount</span>
                  <span className="font-semibold">-{formatPHP(voucherDiscount)}</span>
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="font-semibold text-slate-900">Total Due</span>
                <span className="font-semibold text-slate-900">{formatPHP(totalAmount)}</span>
              </div>
            </div>
            {store.lease_agreement_file_url && (
              <div className="text-sm">
                <p className="font-semibold">Lease Agreement Template</p>
                <a href={store.lease_agreement_file_url} target="_blank" rel="noreferrer" className="underline">
                  Download lease agreement file
                </a>
              </div>
            )}
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Save this page as PDF or screenshot to keep your own copy for reference.
            {!user && onNavigate && (
              <>
                {' '}
                Or <button type="button" className="font-semibold underline" onClick={() => onNavigate('login')}>login</button> so your transaction is saved in your account history.
              </>
            )}
          </div>

          <Card className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <User2 className="h-4 w-4" /> Applicant Information
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input required value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
              </div>
              <div className="space-y-2">
              <PhoneInput label="Contact Number" value={formData.phone} required onChange={(value) => setFormData({ ...formData, phone: value })} />
              </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact Name</label>
              <Input required value={formData.emergencyContactName} onChange={(event) => setFormData({ ...formData, emergencyContactName: event.target.value })} />
              </div>
              <div className="space-y-2">
              <PhoneInput label="Emergency Contact Number" value={formData.emergencyContact} required onChange={(value) => setFormData({ ...formData, emergencyContact: value })} />
              </div>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              disabled={Boolean(user?.email)}
            />
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">Present Address</label>
            <Input required value={formData.presentAddress} onChange={(event) => setFormData({ ...formData, presentAddress: event.target.value })} />
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" /> Delivery & Branch
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Branch</label>
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.storeBranchId} onChange={(event) => setFormData({ ...formData, storeBranchId: event.target.value })} required>
                {(store?.branches?.length ? store.branches : [{ _id: 'main', address: store?.address || 'Main Store' }]).map((branch) => (
                  <option key={String(branch._id || branch.address)} value={String(branch._id || 'main')}>
                    {branch.name ? `${branch.name} - ` : ''}
                    {branch.address}
                  </option>
                ))}
              </select>
            </div>

            {rentalFormSettings.reference_text && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="mb-1 font-semibold text-slate-900">Additional Notes</p>
                <p className="whitespace-pre-line">{rentalFormSettings.reference_text}</p>
              </div>
            )}

            {rentalFormSettings.reference_image_url && rentalFormSettings.reference_image_position === 'top' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Reference Photo</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={rentalFormSettings.reference_image_url} alt="Store reference" className="max-h-72 w-full object-cover" />
                </div>
              </div>
            )}

            {rentalFormSettings.show_branch_map && branchMapSrc && (
              <div className="space-y-2">
                <iframe title="Selected Branch Map" src={branchMapSrc} className="h-56 w-full rounded-2xl border border-slate-200" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            )}

            {rentalFormSettings.reference_image_url && rentalFormSettings.reference_image_position === 'mid' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Reference Photo</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={rentalFormSettings.reference_image_url} alt="Store reference" className="max-h-72 w-full object-cover" />
                </div>
              </div>
            )}

            <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Mode</label>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={formData.deliveryMode}
              onChange={(event) => setFormData({ ...formData, deliveryMode: event.target.value })}
            >
              {(store?.delivery_modes?.length ? store.delivery_modes : ['Store Pickup']).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Address</label>
            <Input required value={formData.deliveryAddress} onChange={(event) => setFormData({ ...formData, deliveryAddress: event.target.value })} />
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4" /> Payment & Required Files
            </p>
            <div className="space-y-2">
            <label className="text-sm font-medium">Payment Mode</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.paymentMode} onChange={(event) => setFormData({ ...formData, paymentMode: event.target.value })}>
              <option value="cash">Cash on Pickup</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="card">Credit/Debit Card</option>
            </select>
            </div>

            <FileUpload
              label="Upload Completed Lease Agreement"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              required={Boolean(store?.lease_agreement_file_url)}
              file={leaseAgreementSubmissionFile}
              onChange={(files) => setLeaseAgreementSubmissionFile(files?.[0] ?? null)}
              helperText="Download the template above, fill it up, then upload your completed copy here."
            />

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold">Rented Gear Details</h3>
              <div className="grid gap-3">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.startDate}-${item.endDate}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
                    <div className="h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                      <img src={item.image_url || `https://picsum.photos/seed/cart-item-${item.id}/120/120`} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.startDate} to {item.endDate}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Daily rate: {formatPHP(item.daily_price)}</span>
                        <span>Qty: {Math.max(1, item.quantity || 1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Identity Documents</h3>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>
            <p className="text-xs text-muted-foreground">Please upload ID 1 (front/back), ID 2 (front/back), and your selfie with ID.</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FileUpload
                label="ID 1 Front"
                accept="image/*,.pdf"
                required
                file={documentFiles.id1_front}
                onChange={(files) => setDocumentFiles((prev) => ({ ...prev, id1_front: files?.[0] ?? null }))}
              />
              <FileUpload
                label="ID 1 Back"
                accept="image/*,.pdf"
                required
                file={documentFiles.id1_back}
                onChange={(files) => setDocumentFiles((prev) => ({ ...prev, id1_back: files?.[0] ?? null }))}
              />
              <FileUpload
                label="ID 2 Front"
                accept="image/*,.pdf"
                required
                file={documentFiles.id2_front}
                onChange={(files) => setDocumentFiles((prev) => ({ ...prev, id2_front: files?.[0] ?? null }))}
              />
              <FileUpload
                label="ID 2 Back"
                accept="image/*,.pdf"
                required
                file={documentFiles.id2_back}
                onChange={(files) => setDocumentFiles((prev) => ({ ...prev, id2_back: files?.[0] ?? null }))}
              />
              <FileUpload
                label="Selfie with ID"
                accept="image/*,.pdf"
                required
                file={documentFiles.selfie_id}
                onChange={(files) => setDocumentFiles((prev) => ({ ...prev, selfie_id: files?.[0] ?? null }))}
              />
            </div>
            </div>
            <FileUpload
              label="Billing Address File (Image/PDF)"
              accept="image/*,.pdf"
              required
              file={billingAddressFile}
              onChange={(files) => setBillingAddressFile(files?.[0] ?? null)}
              helperText="Upload a billing address document that can be reviewed by the store owner."
            />
          </Card>
          {customFields.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="inline-flex items-center gap-2 font-semibold">
                <FileBadge2 className="h-4 w-4" /> Additional Store Requirements
              </h3>
              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      value={customAnswers[field.id] || ''}
                      onChange={(event) => setCustomAnswers((prev) => ({ ...prev, [field.id]: event.target.value }))}
                      placeholder={field.placeholder || ''}
                      className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={customAnswers[field.id] || ''}
                      onChange={(event) => setCustomAnswers((prev) => ({ ...prev, [field.id]: event.target.value }))}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">Select option</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      required={field.required}
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={customAnswers[field.id] || ''}
                      onChange={(event) => setCustomAnswers((prev) => ({ ...prev, [field.id]: event.target.value }))}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
            <button
              type="button"
              className={`relative mt-0.5 inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.agree ? 'bg-emerald-500' : 'bg-slate-300'}`}
              onClick={() => setFormData({ ...formData, agree: !formData.agree })}
              aria-label="Toggle policy agreement"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.agree ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              I have read and agree to the app{' '}
              <button type="button" className="font-semibold underline" onClick={() => onNavigate?.('policies')}>
                Policies and Terms & Conditions
              </button>
              . My application will be reviewed by the store owner.
            </p>
          </div>

          <Card className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Ready to submit</span>
              <span className="text-xs text-muted-foreground">Progress: {completion.percent}%</span>
            </div>
            <Button type="submit" className="h-12 w-full" disabled={submittingApplication}>
              {submittingApplication ? 'Submitting Application...' : 'Submit Application'}
            </Button>
          </Card>
        </form>
      </Card>

      {submittingApplication && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center text-slate-900 shadow-2xl">
            <p className="text-lg font-semibold">Uploading and submitting...</p>
            <p className="mt-2 text-sm text-slate-600">Please wait. If this takes too long, it will auto-cancel and show an error.</p>
          </div>
        </div>
      )}
    </div>
  );
}
