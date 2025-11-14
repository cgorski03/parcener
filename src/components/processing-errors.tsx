import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorReceipt(props: { attempts: number }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
            <div className="text-center">
                <p className="text-lg font-semibold mb-2">Processing Failed</p>
                <p className="text-sm text-muted-foreground">
                    Failed after {props.attempts} attempts
                </p>
            </div>
            <Button>Try Again</Button>
        </div>
    )
}

export function ProcessingReceipt() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing your receipt...</p>
            <Button variant="outline" size="sm">Process Again</Button>
        </div>
    )
}
export function NotFoundReceipt() {
    return (<div>
        Doesnt exist loser
    </div>)
}

