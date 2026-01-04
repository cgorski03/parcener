import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'

interface SettlementWarningProps {
    discrepancy: number
    className?: string
}

export function SettlementWarning({
    discrepancy,
    className,
}: SettlementWarningProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isOverclaimed = discrepancy < -0.05
    const absAmount = Math.abs(discrepancy).toFixed(2)

    // Config based on state
    const config = isOverclaimed
        ? {
            color: "text-destructive",
            borderColor: "border-destructive/30",
            iconBg: "bg-destructive/10",
            title: "Overclaimed Amount",
            desc: "The total claimed exceeds the receipt bill."
        }
        : {
            color: "text-orange-600 dark:text-orange-500",
            borderColor: "border-orange-200 dark:border-orange-800",
            iconBg: "bg-orange-100 dark:bg-orange-900/30",
            title: "Unclaimed Amount",
            desc: "Total claims are less than the receipt bill."
        }

    return (
        <div className={cn(
            "rounded-lg border bg-background p-4 shadow-sm",
            config.borderColor,
            className
        )}>
            <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-md shrink-0", config.iconBg, config.color)}>
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {config.title}
                                <span className={cn("text-xs px-2 py-0.5 rounded-full bg-muted font-mono", config.color)}>
                                    ${absAmount}
                                </span>
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                {config.desc}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {isExpanded && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground animate-in slide-in-from-top-2 fade-in duration-200">
                            <p className="leading-relaxed">
                                If you expect all items to be claimed, this is fine.
                                However, if some items should be claimed but aren't,
                                double check the room.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
