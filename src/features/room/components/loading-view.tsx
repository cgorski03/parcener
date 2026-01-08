import { Loader2 } from 'lucide-react';

export function RoomLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-foreground">Loading Room...</h3>
      </div>
    </div>
  );
}
