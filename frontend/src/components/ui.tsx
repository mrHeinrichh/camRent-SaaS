import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
};

const buttonSizes: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  icon: 'h-9 w-9',
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'i3d-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[10px] font-black uppercase tracking-widest text-[var(--tone-text-muted)] mb-1.5 ml-1 block",
        className
      )}
      {...props}
    />
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <Label>{label}</Label>}
        <div className="relative flex w-full items-center">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 text-[var(--tone-text-muted)]">
              {icon}
            </div>
          )}
          <input
            className={cn(
              "i3d-input flex h-12 w-full rounded-xl border border-[var(--tone-border)] bg-[var(--tone-surface-soft)] px-4 py-2 text-[var(--tone-text)] text-sm shadow-sm transition-all focus-within:bg-[var(--tone-surface)] focus-within:ring-4 focus-within:ring-[var(--tone-accent)]/20 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--tone-text-muted)] focus-visible:outline-none focus-visible:border-[var(--tone-accent)] disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-11",
              error && "border-red-500 ring-red-500/10 focus-within:ring-red-500/20 focus-visible:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-red-500 animate-fade-up">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("i3d-card rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  );
}
