import { useState, type FormEvent } from 'react';
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

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Extract<UserRole, 'renter' | 'owner'>>('renter');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const { setSession } = useAppStore();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            email,
            password,
            role,
            full_name: fullName,
            store_name: role === 'owner' ? storeName : undefined,
            store_address: role === 'owner' ? storeAddress : undefined,
            store_description: role === 'owner' ? storeDescription : undefined,
          }
        : { email, password, role };
      const data = await api.post<AuthResponse>(endpoint, payload);
      console.log('[auth-ui] auth success', { role: data.user.role, email: data.user.email });
      setSession(data.user, data.token);
      onNavigate(data.user.role === 'owner' ? 'owner' : 'home');
    } catch (error: any) {
      console.error('[auth-ui] auth failed', error);
      alert(error.message);
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
            <div className="space-y-2">
              <label className="text-sm font-medium">I want to:</label>
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
                <option value="renter">Rent Equipment</option>
                <option value="owner">Register a Store</option>
              </select>
            </div>
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
            </>
          )}

          <Button type="submit" className="w-full">
            {isRegister ? 'Sign Up' : 'Login'}
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
