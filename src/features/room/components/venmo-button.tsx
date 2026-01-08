import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/components/ui/button';
import { ExternalLink, Smartphone } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface VenmoButtonProps {
  handle: string;
  amount: number;
  note?: string;
  className?: string;
}

export const VenmoButton = ({
  handle,
  amount,
  note = 'Parcener Receipt Split',
  className,
}: VenmoButtonProps) => {
  const isMobile = useIsMobile();
  const formattedAmount = amount.toFixed(2);

  const handlePayment = () => {
    const encodedNote = encodeURIComponent(note);

    if (isMobile) {
      // Mobile: Try deep link
      window.location.href = `venmo://paycharge?txn=pay&recipients=${handle}&amount=${formattedAmount}&note=${encodedNote}`;
    } else {
      // Desktop: Open Web Profile
      window.open(`https://venmo.com/${handle}`, '_blank');
    }
  };

  return (
    <Button
      onClick={handlePayment}
      className={cn(
        'w-full bg-[#3d95ce] hover:bg-[#3d95ce]/90 text-white font-semibold shadow-sm',
        className,
      )}
      size="lg"
    >
      {isMobile ? (
        <Smartphone className="mr-2 h-4 w-4" />
      ) : (
        <ExternalLink className="mr-2 h-4 w-4" />
      )}
      Pay ${formattedAmount} on Venmo
    </Button>
  );
};
