import { Link } from '@tanstack/react-router';

export function ErrorReceiptView(props: { attempts: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Processing Failed</p>
        <p className="text-sm text-muted-foreground">
          Failed after {props.attempts} attempts
        </p>
      </div>
      <Link to="/upload">Try Again</Link>
    </div>
  );
}
