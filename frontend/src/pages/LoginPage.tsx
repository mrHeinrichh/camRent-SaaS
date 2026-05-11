import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { User } from '@/src/types/domain';
import { Button, Card } from '@/src/components/ui';
import { AppFooter } from '@/src/components/layout/AppFooter';
import { siteTheme } from '@/src/config/siteTheme';
import { LoginForm } from '@/src/features/auth/components/LoginForm';
import { RegisterWizard } from '@/src/features/auth/components/RegisterWizard';
import type { RegisterFormState } from '@/src/features/auth/types';

interface LoginPageProps {
  onNavigate: (page: AppPage) => void;
  content?: import('@/src/types/domain').SiteContent;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface UploadResponse {
  url: string;
}

export function LoginPage({ onNavigate, content }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [activeWallpaper, setActiveWallpaper] = useState(0);
  const [missingGoogleAccount, setMissingGoogleAccount] = useState<{ email?: string } | null>(null);
  const [registerInitialEmail, setRegisterInitialEmail] = useState('');
  const { setSession } = useAppStore();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);
  const envMeta = ((import.meta as any).env || {}) as Record<string, string | boolean | undefined>;
  const googleClientId = String(envMeta.VITE_GOOGLE_CLIENT_ID || '').trim();

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setError('');
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setError('');
    setFieldErrors((prev) => ({ ...prev, password: undefined }));
  };

  useEffect(() => {
    const total = siteTheme.login.wallpapers.length;
    if (total <= 1) return;
    const timer = setInterval(() => {
      setActiveWallpaper((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isRegister) {
      googleInitializedRef.current = false;
    }
  }, [isRegister]);

  const uploadImage = async (file: File | null) => {
    if (!file) return undefined;
    const formData = new FormData();
    formData.append('file', file);
    const { url } = await api.post<UploadResponse>('/api/upload/public', formData);
    return url;
  };

  const uploadImages = async (files: File[]) => {
    if (!files.length) return [] as string[];
    const urls = await Promise.all(files.map((file) => uploadImage(file)));
    return urls.filter(Boolean) as string[];
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password.trim()) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (submitting) return;
    setError('');
    setMissingGoogleAccount(null);
    setSubmitting(true);
    try {
      const data = await api.post<AuthResponse>('/api/auth/google', { credential });
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (err: any) {
      if (err?.code === 'GOOGLE_ACCOUNT_NOT_FOUND' || err?.status === 404) {
        setMissingGoogleAccount({ email: err?.details?.email });
        return;
      }
      setError(err.message || 'Google authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openRegisterForMissingGoogleAccount = () => {
    setRegisterInitialEmail(missingGoogleAccount?.email || '');
    setMissingGoogleAccount(null);
    setError('');
    setFieldErrors({});
    setIsRegister(true);
  };

  const handleRegister = async (state: RegisterFormState) => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const [profileImageUrl, storeLogoUrl, storeBannerUrl, leaseAgreementFileUrl, paymentDetailImageUrls] = await Promise.all([
        uploadImage(state.profileImage),
        state.role === 'owner' ? uploadImage(state.storeLogo) : Promise.resolve(undefined),
        state.role === 'owner' ? uploadImage(state.storeBanner) : Promise.resolve(undefined),
        state.role === 'owner' ? uploadImage(state.leaseAgreementFile) : Promise.resolve(undefined),
        state.role === 'owner' ? uploadImages(state.paymentDetailImages || []) : Promise.resolve([]),
      ]);

      const payload = {
        ...(state.role === 'owner'
          ? (() => {
              const mainLat = Number.parseFloat((state.storeBranches[0]?.location_lat || '').trim());
              const mainLng = Number.parseFloat((state.storeBranches[0]?.location_lng || '').trim());
              return {
                store_latitude: Number.isFinite(mainLat) ? mainLat : undefined,
                store_longitude: Number.isFinite(mainLng) ? mainLng : undefined,
              };
            })()
          : {}),
        email: state.email,
        phone: state.phone,
        password: state.password,
        role: state.role,
        full_name: state.fullName,
        profile_image_url: profileImageUrl,
        store_name: state.role === 'owner' ? state.storeName : undefined,
        store_address: state.role === 'owner' ? state.storeAddress : undefined,
        store_description: state.role === 'owner' ? state.storeDescription : undefined,
        store_branches:
          state.role === 'owner'
            ? state.storeBranches.map((branch, index) => ({
                name: (branch.name || '').trim() || (index === 0 ? 'Main Branch' : ''),
                address: (index === 0 ? state.storeAddress : branch.address).trim(),
                location_lat: Number.parseFloat((branch.location_lat || '').trim()),
                location_lng: Number.parseFloat((branch.location_lng || '').trim()),
              }))
            : undefined,
        store_logo_url: state.role === 'owner' ? storeLogoUrl : undefined,
        store_banner_url: state.role === 'owner' ? storeBannerUrl : undefined,
        facebook_url: state.role === 'owner' ? state.facebookUrl : undefined,
        instagram_url: state.role === 'owner' ? state.instagramUrl : undefined,
        tiktok_url: state.role === 'owner' ? state.tiktokUrl : undefined,
        custom_social_links: state.role === 'owner' ? state.customSocialLinks : undefined,
        payment_details: state.role === 'owner' ? state.paymentDetails : undefined,
        payment_detail_images: state.role === 'owner' ? paymentDetailImageUrls : undefined,
        rental_billing_mode: state.role === 'owner' ? state.rentalBillingMode : undefined,
        delivery_modes: state.role === 'owner' ? state.deliveryModes.filter((mode) => mode.trim()) : undefined,
        lease_agreement_file_url: state.role === 'owner' ? leaseAgreementFileUrl : undefined,
        security_deposit: state.role === 'owner' && state.securityDeposit.trim() ? Number.parseFloat(state.securityDeposit) : undefined,
      };

      const data = await api.post<AuthResponse>('/api/auth/register', payload);
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || isRegister) return;
    if (googleInitializedRef.current) return;

    const renderButton = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          if (response?.credential) {
            handleGoogleCredential(response.credential);
          }
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth || 320,
        text: 'signin_with',
      });
      googleInitializedRef.current = true;
    };

    if ((window as any).google?.accounts?.id) {
      renderButton();
      return;
    }

    const existing = document.getElementById('google-identity-script');
    if (existing) {
      existing.addEventListener('load', renderButton);
      return () => existing.removeEventListener('load', renderButton);
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.body.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [googleClientId, isRegister, submitting]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--tone-bg)] px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl rounded-sm border border-[var(--tone-border)] bg-[var(--tone-surface)] p-3 shadow-sm">
        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-sm bg-[var(--tone-surface-soft)] md:min-h-[680px] md:grid-cols-2">
          <div className="flex items-center justify-center px-3 py-5 sm:px-5 sm:py-8 md:px-12">
            <div className="w-full max-w-md animate-fade-up">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[var(--tone-text)] sm:text-4xl">{isRegister ? siteTheme.login.titleRegister : siteTheme.login.titleLogin}</h1>
              <p className="mb-8 text-sm text-[var(--tone-text-muted)]">{isRegister ? siteTheme.login.subtitleRegister : siteTheme.login.subtitleLogin}</p>

              {isRegister ? (
                <Card className="border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] p-5 shadow-none">
                  <RegisterWizard
                    key={registerInitialEmail || 'register'}
                    submitting={submitting}
                    initialEmail={registerInitialEmail}
                    onSubmit={handleRegister}
                    onOpenPolicies={() => onNavigate('policies')}
                  />
                </Card>
              ) : (
                <LoginForm
                  email={email}
                  password={password}
                  submitting={submitting}
                  error={error}
                  fieldErrors={fieldErrors}
                  googleEnabled={Boolean(googleClientId)}
                  googleButtonRef={googleButtonRef}
                  onEmailChange={handleEmailChange}
                  onPasswordChange={handlePasswordChange}
                  onSubmit={handleLogin}
                />
              )}

              <p className="mt-6 text-center text-sm text-[var(--tone-text-muted)]">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  className="font-medium text-[var(--tone-text)] hover:underline"
                  onClick={() => {
                    setRegisterInitialEmail('');
                    setMissingGoogleAccount(null);
                    setIsRegister((value) => !value);
                  }}
                >
                  {isRegister ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>

          <div className="relative hidden min-h-[680px] md:block">
            {siteTheme.login.wallpapers.map((wallpaper, index) => (
              <img
                key={wallpaper}
                src={wallpaper}
                alt="Camera wallpaper"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === activeWallpaper ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--tone-image-overlay)]/15 to-transparent" />
          </div>
        </div>
      </div>

      <AppFooter onNavigate={onNavigate} content={content} />

      {missingGoogleAccount && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="missing-google-account-title">
          <div className="w-full max-w-sm rounded-lg border border-[var(--tone-border)] bg-[var(--tone-surface)] p-6 text-center shadow-2xl">
            <h2 id="missing-google-account-title" className="text-xl font-semibold text-[var(--tone-text)]">
              Account does not exist
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--tone-text-muted)]">
              {missingGoogleAccount.email ? `${missingGoogleAccount.email} is not registered yet.` : 'This Google account is not registered yet.'}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button type="button" className="w-full" onClick={openRegisterForMissingGoogleAccount}>
                Register Account
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setMissingGoogleAccount(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
