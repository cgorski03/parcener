import { ReceiptItemDto } from "@/server/get-receipt/get-receipt-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function ReceiptItemCard(props: { item: ReceiptItemDto }) {
    const { item } = props;
    return (
        <div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{item.interpretedText}</CardTitle>
                    <CardDescription>
                        {item.rawText}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {item.price}
                </CardContent>
            </Card>
        </div>)
}
