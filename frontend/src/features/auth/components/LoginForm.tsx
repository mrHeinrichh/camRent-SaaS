import type { FormEvent } from 'react';
import { Button, Input } from '@/src/components/ui';

interface LoginFormProps {
  email: string;
  password: string;
  submitting: boolean;
  googleEnabled?: boolean;
  googleButtonRef?: React.RefObject<HTMLDivElement>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LoginForm({ email, password, submitting, googleEnabled, googleButtonRef, onEmailChange, onPasswordChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] p-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--tone-text)]">Email</label>
        <Input
          type="email"
          required
          placeholder="Type your email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="h-11 border-[var(--tone-border)] bg-white"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--tone-text)]">Password</label>
        <Input
          type="password"
          required
          placeholder="Type your password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          className="h-11 border-[var(--tone-border)] bg-white"
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[var(--tone-text-muted)]">
          <input type="checkbox" className="h-4 w-4 accent-[var(--tone-accent)]" />
          Remember me
        </label>
        <button type="button" className="text-[var(--tone-text-muted)] hover:underline">
          Forgot password?
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Please wait...' : 'Login'}
      </Button>
      <div className="space-y-4 pt-1">
        <div className="h-px w-full bg-[var(--tone-border)]" />
        <p className="text-center text-sm text-[var(--tone-text-muted)]">Or</p>
        {googleEnabled ? (
          <div ref={googleButtonRef} className="flex w-full justify-center" />
        ) : (
          <Button type="button" variant="outline" disabled className="w-full border-[var(--tone-border)] bg-[var(--tone-surface)] text-[var(--tone-text)] opacity-70">
            Google sign-in unavailable
          </Button>
        )}
      </div>
    </form>
  );
}
