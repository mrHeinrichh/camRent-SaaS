import type { FormEvent } from 'react';
import { Button, Input } from '@/src/components/ui';

interface LoginFormProps {
  email: string;
  password: string;
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LoginForm({ email, password, submitting, onEmailChange, onPasswordChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" required value={email} onChange={(event) => onEmailChange(event.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" required value={password} onChange={(event) => onPasswordChange(event.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Please wait...' : 'Login'}
      </Button>
    </form>
  );
}

