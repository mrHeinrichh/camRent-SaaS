import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui';

interface SuccessPageProps {
  onBackHome: () => void;
}

export function SuccessPage({ onBackHome }: SuccessPageProps) {
  return (
    <div className="container mx-auto py-20 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
      <h1 className="mb-2 text-3xl font-bold">Application Submitted!</h1>
      <p className="mb-8 text-muted-foreground">The store owner will review your documents and approve your request shortly.</p>
      <Button onClick={onBackHome}>Back to Home</Button>
    </div>
  );
}
