import { useMemo, useState, type FormEvent } from 'react';
import { api } from '@/src/lib/api';
import { useAppStore } from '@/src/store';
import type { AppPage } from '@/src/types/app';
import type { User, UserRole } from '@/src/types/domain';
import { Button, Card, Input } from '@/src/components/ui';

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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Extract<UserRole, 'renter' | 'owner'>>('renter');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeBanner, setStoreBanner] = useState<File | null>(null);
  const [storeLatitude, setStoreLatitude] = useState('');
  const [storeLongitude, setStoreLongitude] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLogs, setLocationLogs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { setSession } = useAppStore();

  const hasLatInput = storeLatitude.trim() !== '';
  const hasLngInput = storeLongitude.trim() !== '';
  const parsedLat = Number.parseFloat(storeLatitude);
  const parsedLng = Number.parseFloat(storeLongitude);
  const hasValidPin =
    hasLatInput &&
    hasLngInput &&
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  const mapSrc = useMemo(() => {
    if (!hasValidPin) return '';
    const deltaLng = 0.015;
    const deltaLat = 0.01;
    const minLng = Math.max(-180, parsedLng - deltaLng);
    const maxLng = Math.min(180, parsedLng + deltaLng);
    const minLat = Math.max(-90, parsedLat - deltaLat);
    const maxLat = Math.min(90, parsedLat + deltaLat);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${parsedLat}%2C${parsedLng}`;
  }, [hasValidPin, parsedLat, parsedLng]);

  const uploadImage = async (file: File | null) => {
    if (!file) return undefined;
    const formData = new FormData();
    formData.append('file', file);
    const { url } = await api.post<UploadResponse>('/api/upload/public', formData);
    return url;
  };

  const pushLocationLog = (message: string, payload?: Record<string, unknown>) => {
    const line = `${new Date().toLocaleTimeString()} ${message}${payload ? ` ${JSON.stringify(payload)}` : ''}`;
    console.log('[geolocation]', message, payload || '');
    setLocationLogs((prev) => [line, ...prev].slice(0, 12));
  };

  const fillWithCurrentLocation = async () => {
    if (!navigator.geolocation) {
      pushLocationLog('navigator.geolocation unavailable');
      alert('Geolocation is not available in this browser.');
      return;
    }

    const startedAt = performance.now();
    pushLocationLog('request started', { origin: window.location.origin, secureContext: window.isSecureContext });

    if ('permissions' in navigator && navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        pushLocationLog('permission state', { state: permission.state });
      } catch (error: any) {
        pushLocationLog('permission query failed', { message: error?.message || 'unknown error' });
      }
    }

    setLocationLoading(true);

    const onSuccess = (position: GeolocationPosition) => {
      setStoreLatitude(position.coords.latitude.toFixed(6));
      setStoreLongitude(position.coords.longitude.toFixed(6));
      setLocationLoading(false);
      pushLocationLog('request success', {
        elapsedMs: Math.round(performance.now() - startedAt),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      });
    };

    const onFail = (error: GeolocationPositionError) => {
      pushLocationLog('first attempt failed', {
        elapsedMs: Math.round(performance.now() - startedAt),
        code: error.code,
        message: error.message,
      });
      // Retry once with relaxed settings before failing.
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (retryError) => {
          setLocationLoading(false);
          pushLocationLog('retry failed', {
            elapsedMs: Math.round(performance.now() - startedAt),
            code: retryError.code,
            message: retryError.message,
          });
          alert(
            retryError.message ||
              error.message ||
              'Unable to get your current location. Allow location permission and ensure you are on localhost or HTTPS.',
          );
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 },
      );
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onFail, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

      if (isRegister) {
        if (role === 'owner' && !hasValidPin) {
          throw new Error('Store location pin is required. Please provide valid latitude and longitude.');
        }

        const [profileImageUrl, storeLogoUrl, storeBannerUrl] = await Promise.all([
          uploadImage(profileImage),
          role === 'owner' ? uploadImage(storeLogo) : Promise.resolve(undefined),
          role === 'owner' ? uploadImage(storeBanner) : Promise.resolve(undefined),
        ]);

        const payload = {
          email,
          password,
          role,
          full_name: fullName,
          profile_image_url: profileImageUrl,
          store_name: role === 'owner' ? storeName : undefined,
          store_address: role === 'owner' ? storeAddress : undefined,
          store_description: role === 'owner' ? storeDescription : undefined,
          store_logo_url: role === 'owner' ? storeLogoUrl : undefined,
          store_banner_url: role === 'owner' ? storeBannerUrl : undefined,
          store_latitude: role === 'owner' ? parsedLat : undefined,
          store_longitude: role === 'owner' ? parsedLng : undefined,
        };

        const data = await api.post<AuthResponse>(endpoint, payload);
        setSession(data.user, data.token);
        onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
      } else {
        const data = await api.post<AuthResponse>(endpoint, { email, password });
        setSession(data.user, data.token);
        onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
      }
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-20">
      <Card className="p-8">
        <h1 className="mb-6 text-center text-2xl font-bold">{isRegister ? 'Create Account' : 'Welcome Back'}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          {isRegister && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Image (optional)</label>
                <Input type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] ?? null)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">I want to:</label>
                <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
                  <option value="renter">Rent Equipment</option>
                  <option value="owner">Register a Store</option>
                </select>
              </div>
            </>
          )}

          {isRegister && role === 'owner' && (
            <>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Logo (optional)</label>
                <Input type="file" accept="image/*" onChange={(event) => setStoreLogo(event.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Cover Photo (optional)</label>
                <Input type="file" accept="image/*" onChange={(event) => setStoreBanner(event.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Store Pin (Geo Map)</label>
                  <Button type="button" variant="outline" size="sm" onClick={fillWithCurrentLocation} disabled={locationLoading}>
                    {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    required
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={storeLatitude}
                    onChange={(event) => setStoreLatitude(event.target.value)}
                  />
                  <Input
                    required
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={storeLongitude}
                    onChange={(event) => setStoreLongitude(event.target.value)}
                  />
                </div>
                {locationLogs.length > 0 && (
                  <div className="rounded-md border bg-muted/30 p-2">
                    <p className="mb-1 text-xs font-semibold">Location Debug Logs</p>
                    <div className="max-h-28 space-y-1 overflow-auto font-mono text-[10px] leading-tight text-muted-foreground">
                      {locationLogs.map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                {hasValidPin && (
                  <div className="space-y-2">
                    <iframe
                      title="Store Location Preview"
                      src={mapSrc}
                      className="h-48 w-full rounded-md border"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${parsedLat}&mlon=${parsedLng}#map=16/${parsedLat}/${parsedLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Open pin in map
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegister ? 'Sign Up' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => setIsRegister((value) => !value)}>
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </Card>
    </div>
  );
}
