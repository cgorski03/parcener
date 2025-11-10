import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReceiptItemDto } from "@/server/dtos";
import { DollarSign } from "lucide-react";

export function ReceiptItemCard(props: {
    item: ReceiptItemDto;
    onEdit?: () => void;
}) {
    const { item, onEdit } = props;
    const unitPrice = (item.price / item.quantity).toFixed(2);
    const hasMultiple = item.quantity > 1;

    return (
        <Card
            className="group relative overflow-hidden py-0 transition-all hover:shadow-lg cursor-pointer border-l-4 border-l-primary/40 hover:border-l-primary active:scale-[0.99]"
            onClick={onEdit}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl -translate-y-16 translate-x-16 group-hover:from-primary/10 transition-colors" />

            <div className="relative p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base leading-tight">
                                {hasMultiple && item.quantity} {item.interpretedText}
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded inline-block">
                            Raw: {item.rawText}
                        </p>
                    </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xl font-bold text-foreground">
                                {item.price}
                            </span>
                        </div>

                    </div>

                    {hasMultiple && (
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                                Unit Price
                            </div>
                            <div className="text-sm font-semibold text-primary">
                                ${unitPrice}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
