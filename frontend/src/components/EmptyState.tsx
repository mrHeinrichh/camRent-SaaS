interface EmptyStateProps {
  title: string;
  message: string;
  className?: string;
}

export function EmptyState({ title, message, className = '' }: EmptyStateProps) {
  return (
    <div className={`rounded-xl border bg-muted/20 p-4 text-center ${className}`}>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
