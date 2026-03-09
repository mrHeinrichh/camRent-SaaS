import { useState, type FormEvent } from 'react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { User } from '@/src/types/domain';
import { Card } from '@/src/components/ui';
import { LoginForm } from '@/src/features/auth/components/LoginForm';
import { RegisterWizard } from '@/src/features/auth/components/RegisterWizard';
import type { RegisterFormState } from '@/src/features/auth/types';

interface LoginPageProps {
  onNavigate: (page: AppPage) => void;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface UploadResponse {
  url: string;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAppStore();

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
    setSubmitting(true);
    try {
      const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (state: RegisterFormState) => {
    if (submitting) return;
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
        payment_details: state.role === 'owner' ? state.paymentDetails : undefined,
        payment_detail_images: state.role === 'owner' ? paymentDetailImageUrls : undefined,
        delivery_modes: state.role === 'owner' ? state.deliveryModes.filter((mode) => mode.trim()) : undefined,
        lease_agreement_file_url: state.role === 'owner' ? leaseAgreementFileUrl : undefined,
        security_deposit: state.role === 'owner' && state.securityDeposit.trim() ? Number.parseFloat(state.securityDeposit) : undefined,
      };

      const data = await api.post<AuthResponse>('/api/auth/register', payload);
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/15),transparent_45%),radial-gradient(ellipse_at_bottom_right,theme(colors.secondary/20),transparent_45%)]" />
      <div className="container relative mx-auto max-w-2xl px-4 py-12">
        <Card className="border-white/20 bg-card/95 p-8 shadow-2xl backdrop-blur">
          <h1 className="mb-1 text-center text-3xl font-bold">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isRegister ? 'Use the step-by-step flow to finish signup faster.' : 'Sign in to continue.'}
          </p>

          {isRegister ? (
            <RegisterWizard submitting={submitting} onSubmit={handleRegister} onOpenPolicies={() => onNavigate('policies')} />
          ) : (
            <LoginForm
              email={email}
              password={password}
              submitting={submitting}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
            />
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="font-medium text-primary hover:underline" onClick={() => setIsRegister((value) => !value)}>
              {isRegister ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </Card>
      </div>

      <footer className="border-t bg-muted/20">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wide">Company</h4>
            <p className="text-base font-semibold">CamRent PH</p>
            <p className="text-sm text-muted-foreground">
              Camera rental workflow platform for inventory, renter records, and fraud monitoring.
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
