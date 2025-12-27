import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Smartphone, Laptop } from "lucide-react";

export const VenmoButton = ({ username = "connorpinzon", amount = "1.00", note = "Sent from parcener" }) => {
    const isMobile = useIsMobile();

    const handlePayment = () => {
        const encdoedNote = encodeURIComponent(note);

        if (isMobile) {
            // Mobile: Open App
            window.location.href = `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encdoedNote}`;
        } else {
            // Desktop: Open Web Profile
            window.open(`https://venmo.com/${username}`, "_blank");
        }
    };

    return (
        <Button
            onClick={handlePayment}
            className="bg-[#3d95ce] hover:bg-[#3d95ce]/90 text-white"
        >
            {isMobile ? (
                <Smartphone className="mr-2 h-4 w-4" />
            ) : (
                <Laptop className="mr-2 h-4 w-4" />
            )}
            Pay ${amount} on Venmo
        </Button>
    );
};
