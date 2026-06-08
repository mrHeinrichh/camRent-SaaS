import type { FormEvent } from 'react';
import { Button, Input } from '@/src/components/ui';

interface LoginFormProps {
  email: string;
  password: string;
  submitting: boolean;
  error?: string;
  cooldownSeconds?: number;
  fieldErrors?: { email?: string; password?: string };
  googleEnabled?: boolean;
  googleButtonRef?: React.RefObject<HTMLDivElement>;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LoginForm({ email, password, submitting, error, cooldownSeconds = 0, fieldErrors, googleEnabled, googleButtonRef, onEmailChange, onPasswordChange, onSubmit }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] p-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 animate-fade-up">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Input
          label="Email"
          type="email"
          required
          placeholder="Type your email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          error={fieldErrors?.email}
          className="h-11 border-[var(--tone-border)] bg-white"
        />
      </div>
      <div className="space-y-2">
        <Input
          label="Password"
          type="password"
          required
          placeholder="Type your password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          error={fieldErrors?.password}
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
      <Button type="submit" className="w-full" disabled={submitting || cooldownSeconds > 0}>
        {submitting ? 'Please wait...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Login'}
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
