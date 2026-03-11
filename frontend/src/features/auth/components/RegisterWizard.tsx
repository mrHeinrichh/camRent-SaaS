import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Card, Input } from '@/src/components/ui';
import { FileUpload } from '@/src/components/FileUpload';
import { PhoneInput } from '@/src/components/PhoneInput';
import { api } from '@/src/lib/api';
import { validatePhone } from '@/src/lib/phone';
import type { RegisterFormState, StoreBranchInput } from '@/src/features/auth/types';

interface RegisterWizardProps {
  submitting: boolean;
  onSubmit: (state: RegisterFormState) => Promise<void>;
  onOpenPolicies: () => void;
}

const defaultBranches: StoreBranchInput[] = [{ name: 'Main Branch', address: '', location_lat: '', location_lng: '' }];

export function RegisterWizard({ submitting, onSubmit, onOpenPolicies }: RegisterWizardProps) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeBranches, setStoreBranches] = useState<StoreBranchInput[]>(defaultBranches);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [customSocialLinks, setCustomSocialLinks] = useState<string[]>(['']);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentDetailImages, setPaymentDetailImages] = useState<File[]>([]);
  const [leaseAgreementFile, setLeaseAgreementFile] = useState<File | null>(null);
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [deliveryModes, setDeliveryModes] = useState<string[]>(['Store Pickup']);
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeBanner, setStoreBanner] = useState<File | null>(null);
  const [branchLocationQueries, setBranchLocationQueries] = useState<Record<number, string>>({});
  const [branchSearchLoading, setBranchSearchLoading] = useState<Record<number, boolean>>({});
  const [branchSearchResults, setBranchSearchResults] = useState<Record<number, Array<{ name: string; lat: string; lon: string }>>>({});
  const [branchLocationLoading, setBranchLocationLoading] = useState<Record<number, boolean>>({});
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const totalSteps = role === 'owner' ? 3 : 2;

  const validateStep = (targetStep: number) => {
    if (targetStep === 1) return true;
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      alert('Full name, email, phone, and password are required.');
      return false;
    }
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
      alert(phoneCheck.error);
      return false;
    }
    if (!otpVerified) {
      alert('Please verify your email first.');
      return false;
    }
    if (targetStep === 2) return true;
    if (!storeName.trim() || !storeAddress.trim() || !storeDescription.trim()) {
      alert('Store name, address, and description are required.');
      return false;
    }
    if (!paymentDetails.trim()) {
      alert('Payment details are required.');
      return false;
    }
    if (!deliveryModes.some((mode) => mode.trim())) {
      alert('Add at least one delivery mode.');
      return false;
    }
    if (!leaseAgreementFile) {
      alert('Lease agreement file is required.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    const nextStep = Math.min(totalSteps, step + 1);
    if (!validateStep(nextStep)) return;
    setPolicyError('');
    setStep(nextStep);
  };

  const handleBack = () => {
    setPolicyError('');
    setStep((current) => Math.max(1, current - 1));
  };

  useEffect(() => {
    if (!otpCooldown) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setOtpMessage('');
    setOtpError('');
  }, [email, role]);

  const requestOtp = async () => {
    if (otpSending || otpCooldown) return;
    if (!email.trim()) {
      setOtpError('Email is required to send a code.');
      return;
    }
    setOtpSending(true);
    setOtpError('');
    setOtpMessage('');
    try {
      await api.post<{ success: boolean; expires_in: number }>('/api/auth/send-otp', { email });
      setOtpSent(true);
      setOtpMessage('Verification code sent. Check your email.');
      setOtpCooldown(60);
    } catch (error: any) {
      setOtpError(error.message || 'Unable to send verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otpVerifying) return;
    if (!otpCode.trim()) {
      setOtpError('Enter the verification code.');
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    setOtpMessage('');
    try {
      await api.post<{ success: boolean }>('/api/auth/verify-otp', { email, code: otpCode });
      setOtpVerified(true);
      setOtpMessage('Email verified successfully.');
    } catch (error: any) {
      setOtpError(error.message || 'Invalid verification code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const updateDeliveryMode = (index: number, value: string) => {
    setDeliveryModes((previous) => previous.map((mode, currentIndex) => (currentIndex === index ? value : mode)));
  };

  const addDeliveryMode = () => setDeliveryModes((previous) => [...previous, '']);
  const removeDeliveryMode = (index: number) => setDeliveryModes((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  const updateCustomSocialLink = (index: number, value: string) => setCustomSocialLinks((previous) => previous.map((entry, currentIndex) => (currentIndex === index ? value : entry)));
  const addCustomSocialLink = () => setCustomSocialLinks((previous) => [...previous, '']);
  const removeCustomSocialLink = (index: number) => setCustomSocialLinks((previous) => previous.filter((_, currentIndex) => currentIndex !== index));

  const updateStoreBranch = (index: number, key: keyof StoreBranchInput, value: string) => {
    setStoreBranches((previous) => previous.map((branch, currentIndex) => (currentIndex === index ? { ...branch, [key]: value } : branch)));
  };

  const addStoreBranch = () => setStoreBranches((previous) => [...previous, { name: '', address: '', location_lat: '', location_lng: '' }]);
  const removeStoreBranch = (index: number) => setStoreBranches((previous) => previous.filter((_, currentIndex) => currentIndex !== index));

  const fillWithCurrentLocation = (branchIndex: number) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not available in this browser.');
      return;
    }
    setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: true }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateStoreBranch(branchIndex, 'location_lat', position.coords.latitude.toFixed(6));
        updateStoreBranch(branchIndex, 'location_lng', position.coords.longitude.toFixed(6));
        setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: false }));
      },
      async (error) => {
        setBranchLocationLoading((prev) => ({ ...prev, [branchIndex]: false }));
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) throw new Error(`IP lookup failed with status ${response.status}`);
          const data = (await response.json()) as { latitude?: number; longitude?: number };
          if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) throw new Error('IP lookup returned invalid coordinates');
          updateStoreBranch(branchIndex, 'location_lat', Number(data.latitude).toFixed(6));
          updateStoreBranch(branchIndex, 'location_lng', Number(data.longitude).toFixed(6));
          alert('Precise GPS location unavailable. Using approximate location based on your network.');
          return;
        } catch {
          alert(error.message || 'Unable to get your current location.');
        }
      },
    );
  };

  const searchLocationByName = async (branchIndex: number) => {
    const query = (branchLocationQueries[branchIndex] || '').trim();
    if (!query) return;
    setBranchSearchLoading((prev) => ({ ...prev, [branchIndex]: true }));
    setBranchSearchResults((prev) => ({ ...prev, [branchIndex]: [] }));
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
      const data = (await response.json()) as Array<{ display_name: string; lat: string; lon: string }>;
      setBranchSearchResults((prev) => ({ ...prev, [branchIndex]: data.map((item) => ({ name: item.display_name, lat: item.lat, lon: item.lon })) }));
    } catch (error: any) {
      alert(error?.message || 'Failed to search location by name.');
    } finally {
      setBranchSearchLoading((prev) => ({ ...prev, [branchIndex]: false }));
    }
  };

  const getBranchMapSrc = (branch: StoreBranchInput) => {
    const lat = Number.parseFloat(branch.location_lat);
    const lng = Number.parseFloat(branch.location_lng);
    const valid = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    if (!valid) return '';
    const minLng = Math.max(-180, lng - 0.015);
    const maxLng = Math.min(180, lng + 0.015);
    const minLat = Math.max(-90, lat - 0.01);
    const maxLat = Math.min(90, lat + 0.01);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  const progress = useMemo(() => Math.round((step / totalSteps) * 100), [step, totalSteps]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (step < totalSteps) {
      handleNext();
      return;
    }
    if (!validateStep(totalSteps)) return;
    if (!agreePolicies) {
      setPolicyError('Please confirm that you have read the Policies and Terms & Conditions.');
      return;
    }
    setPolicyError('');
    if (role === 'owner' && !otpVerified) {
      alert('Please verify your owner email before submitting.');
      return;
    }
    if (role === 'owner') {
      const invalidBranch = storeBranches.find((branch, index) => {
        const address = (index === 0 ? storeAddress : branch.address).trim();
        const lat = Number.parseFloat((branch.location_lat || '').trim());
        const lng = Number.parseFloat((branch.location_lng || '').trim());
        return !address || !Number.isFinite(lat) || !Number.isFinite(lng);
      });
      if (invalidBranch) {
        alert('Every store branch must have address and valid pin location.');
        return;
      }
    }
    await onSubmit({
      fullName,
      email,
      phone,
      password,
      role,
      profileImage,
      storeName,
      storeAddress,
      storeDescription,
      storeBranches,
      facebookUrl,
      instagramUrl,
      tiktokUrl,
      customSocialLinks: customSocialLinks.map((value) => value.trim()).filter(Boolean),
      paymentDetails,
      paymentDetailImages,
      leaseAgreementFile,
      securityDeposit,
      deliveryModes,
      storeLogo,
      storeBanner,
      agreePolicies,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 1 && (
        <Card className="space-y-4 border-dashed p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <PhoneInput label="Contact Number" value={phone} required onChange={setPhone} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <FileUpload
            label="Profile Image (optional)"
            accept="image/*"
            file={profileImage}
            onChange={(files) => setProfileImage(files?.[0] ?? null)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">I want to</label>
            <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={role} onChange={(event) => setRole(event.target.value === 'owner' ? 'owner' : 'renter')}>
              <option value="renter">Rent Equipment</option>
              <option value="owner">Register a Store</option>
            </select>
          </div>
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <label className="text-sm font-medium">Email Verification</label>
            {role === 'renter' ? (
              <p className="text-xs text-muted-foreground">Use Google sign-in to skip email verification, or verify by code below.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Owner accounts must verify email before continuing.</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={requestOtp} disabled={otpSending || otpCooldown > 0}>
                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSending ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
              </Button>
              {otpVerified ? (
                <span className="text-xs font-medium text-emerald-600">Verified</span>
              ) : (
                <span className="text-xs text-muted-foreground">Code expires in 10 minutes</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="max-w-[200px]"
              />
              <Button type="button" size="sm" onClick={verifyOtp} disabled={otpVerifying || otpVerified}>
                {otpVerified ? 'Verified' : otpVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            {otpMessage ? <p className="text-xs text-emerald-600">{otpMessage}</p> : null}
            {otpError ? <p className="text-xs text-red-600">{otpError}</p> : null}
          </div>
        </Card>
      )}

      {step === 2 && role === 'owner' && (
        <Card className="space-y-4 border-dashed p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Store Name</label>
            <Input required value={storeName} onChange={(event) => setStoreName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Store Address</label>
            <Input required value={storeAddress} onChange={(event) => setStoreAddress(event.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Store Description</label>
            <textarea
              required
              value={storeDescription}
              onChange={(event) => setStoreDescription(event.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Facebook URL (optional)</label>
              <Input type="url" value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Instagram URL (optional)</label>
              <Input type="url" value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">TikTok URL (optional)</label>
              <Input type="url" value={tiktokUrl} onChange={(event) => setTiktokUrl(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Custom Social Links (optional)</label>
                <Button type="button" variant="outline" size="sm" onClick={addCustomSocialLink}>Add</Button>
              </div>
              {customSocialLinks.map((link, index) => (
                <div key={`custom-social-${index}`} className="flex items-center gap-2">
                  <Input type="url" placeholder="https://your-social-link.com" value={link} onChange={(event) => updateCustomSocialLink(index, event.target.value)} />
                  {customSocialLinks.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomSocialLink(index)}>Remove</Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Details</label>
            <textarea
              required
              value={paymentDetails}
              onChange={(event) => setPaymentDetails(event.target.value)}
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <FileUpload
            label="Payment QR / Reference Images (optional)"
            accept="image/*"
            multiple
            files={paymentDetailImages}
            onChange={(files) => setPaymentDetailImages(Array.from(files || []))}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Delivery Modes</label>
              <Button type="button" variant="outline" size="sm" onClick={addDeliveryMode}>Add</Button>
            </div>
            {deliveryModes.map((mode, index) => (
              <div key={`delivery-${index}`} className="flex items-center gap-2">
                <span className="text-sm">•</span>
                <Input required value={mode} onChange={(event) => updateDeliveryMode(index, event.target.value)} />
                {deliveryModes.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDeliveryMode(index)}>Remove</Button>
                )}
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FileUpload
              label="Lease Agreement File"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              file={leaseAgreementFile}
              onChange={(files) => setLeaseAgreementFile(files?.[0] ?? null)}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Security Deposit Policy Amount</label>
              <Input type="number" min="0" step="0.01" value={securityDeposit} onChange={(event) => setSecurityDeposit(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FileUpload
              label="Store Logo (optional)"
              accept="image/*"
              file={storeLogo}
              onChange={(files) => setStoreLogo(files?.[0] ?? null)}
            />
            <FileUpload
              label="Store Cover Photo (optional)"
              accept="image/*"
              file={storeBanner}
              onChange={(files) => setStoreBanner(files?.[0] ?? null)}
            />
          </div>
        </Card>
      )}

      {step === 2 && role === 'renter' && (
        <Card className="space-y-3 border-dashed p-4 text-sm text-muted-foreground">
          <p>Review your account details and submit to create your renter account.</p>
          <p>Name: <span className="font-medium text-foreground">{fullName}</span></p>
          <p>Email: <span className="font-medium text-foreground">{email}</span></p>
          <p>Contact: <span className="font-medium text-foreground">{phone}</span></p>
        </Card>
      )}

      {step === 3 && role === 'owner' && (
        <Card className="space-y-3 border-dashed p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Branch Locations</label>
            <Button type="button" variant="outline" size="sm" onClick={addStoreBranch}>Add Branch</Button>
          </div>
          <div className="space-y-3">
            {storeBranches.map((branch, index) => (
              <div key={`branch-${index}`} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">{index === 0 ? 'Main Branch' : `Branch ${index + 1}`}</p>
                  {index > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => removeStoreBranch(index)}>Remove</Button>}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    required
                    placeholder="Branch Name"
                    value={index === 0 ? 'Main Branch' : branch.name}
                    onChange={(event) => updateStoreBranch(index, 'name', event.target.value)}
                    disabled={index === 0}
                  />
                  <Input
                    required
                    placeholder="Branch Address"
                    value={index === 0 ? storeAddress : branch.address}
                    onChange={(event) => (index === 0 ? setStoreAddress(event.target.value) : updateStoreBranch(index, 'address', event.target.value))}
                  />
                  <Input required type="number" step="any" placeholder="Latitude" value={branch.location_lat} onChange={(event) => updateStoreBranch(index, 'location_lat', event.target.value)} />
                  <Input required type="number" step="any" placeholder="Longitude" value={branch.location_lng} onChange={(event) => updateStoreBranch(index, 'location_lng', event.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fillWithCurrentLocation(index)} disabled={Boolean(branchLocationLoading[index])}>
                    {branchLocationLoading[index] ? 'Getting Location...' : 'Use Current Location'}
                  </Button>
                  <Input
                    value={branchLocationQueries[index] || ''}
                    onChange={(event) => setBranchLocationQueries((prev) => ({ ...prev, [index]: event.target.value }))}
                    placeholder="Search place name"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => searchLocationByName(index)} disabled={Boolean(branchSearchLoading[index])}>
                    {branchSearchLoading[index] ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                {(branchSearchResults[index] || []).length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-auto rounded-md border p-2">
                    {(branchSearchResults[index] || []).map((result, resultIndex) => (
                      <button
                        key={`${result.lat}-${result.lon}-${resultIndex}`}
                        type="button"
                        className="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted"
                        onClick={() => {
                          updateStoreBranch(index, 'location_lat', Number.parseFloat(result.lat).toFixed(6));
                          updateStoreBranch(index, 'location_lng', Number.parseFloat(result.lon).toFixed(6));
                          setBranchLocationQueries((prev) => ({ ...prev, [index]: result.name }));
                          setBranchSearchResults((prev) => ({ ...prev, [index]: [] }));
                        }}
                      >
                        {result.name}
                      </button>
                    ))}
                  </div>
                )}
                {getBranchMapSrc(branch) && (
                  <iframe
                    title={`Branch ${index + 1}`}
                    src={getBranchMapSrc(branch)}
                    className="h-40 w-full rounded-md border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === totalSteps && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
          <button
            type="button"
            className={`relative mt-0.5 inline-flex h-5 w-9 items-center rounded-full transition-colors ${agreePolicies ? 'bg-emerald-500' : 'bg-slate-300'}`}
            onClick={() => {
              setAgreePolicies((prev) => !prev);
              setPolicyError('');
            }}
            aria-label="Toggle policy agreement"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agreePolicies ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            I have read and agree to the app{' '}
            <button type="button" className="font-semibold underline" onClick={onOpenPolicies}>
              Policies and Terms & Conditions
            </button>
            .
          </p>
        </div>
      )}
      {step === totalSteps && policyError ? <p className="text-xs font-medium text-red-600">{policyError}</p> : null}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || submitting}>Back</Button>
        {step < totalSteps ? (
          <Button type="button" onClick={handleNext} disabled={submitting}>Next</Button>
        ) : (
          <Button type="submit" disabled={submitting}>{submitting ? 'Please wait...' : 'Sign Up'}</Button>
        )}
      </div>
    </form>
  );
}
