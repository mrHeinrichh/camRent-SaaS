interface EmptyStateProps {
  title: string;
  message: string;
  imageUrl?: string;
  className?: string;
}

const DEFAULT_EMPTY_IMAGE = 'https://placehold.co/900x520?text=Not+Available+As+Of+The+Moment';

export function EmptyState({ title, message, imageUrl = DEFAULT_EMPTY_IMAGE, className = '' }: EmptyStateProps) {
  return (
    <div className={`rounded-xl border bg-muted/20 p-4 text-center ${className}`}>
      <div className="mx-auto mb-3 flex max-w-md items-center justify-center overflow-hidden rounded-lg border bg-background p-2">
        <img src={imageUrl} alt={title} className="h-40 w-full object-contain" referrerPolicy="no-referrer" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
