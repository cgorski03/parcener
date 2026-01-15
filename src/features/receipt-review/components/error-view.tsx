import { Link } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export function ErrorReceiptView(props: { attempts: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Processing Failed</p>
        <p className="text-sm text-muted-foreground">
          Failed after {props.attempts} attempts
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/upload">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Link>
      </Button>
    </div>
  );
}
