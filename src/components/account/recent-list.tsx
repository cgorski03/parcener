import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface RecentListProps<T> {
    title: string;
    data: T[] | undefined;
    isLoading: boolean;
    emptyState: {
        icon: React.ReactNode;
        title: string;
        description: string;
        cta?: string;
        ctaLink?: string;
    };
    renderItem: (item: T) => React.ReactNode;
    addButton?: {
        link: string;
        text: string;
        icon: React.ReactNode;
    };
}

export function RecentList<T>({
    title,
    data,
    isLoading,
    emptyState,
    renderItem,
    addButton,
}: RecentListProps<T>) {
    // Loading State
    if (isLoading) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {title}
                    </h3>
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="bg-background rounded-xl border shadow-sm divide-y">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center p-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="ml-3 flex-1">
                                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                                <div className="h-3 bg-muted rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty State
    if (!data?.length) {
        return (
            <div className="bg-background rounded-xl border shadow-sm p-6 text-center space-y-4">
                {emptyState.icon}
                <div>
                    <p className="text-sm font-medium text-foreground mb-1">{emptyState.title}</p>
                    <p className="text-xs text-muted-foreground mb-4">{emptyState.description}</p>
                </div>
                {
                    emptyState.ctaLink && emptyState.cta &&
                    (<Link to={emptyState.ctaLink} className="block">
                        <Button className="w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                            {emptyState.cta}
                        </Button>
                    </Link>
                    )
                }
            </div>
        );
    }

    // Success State
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between pl-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {title}
                </h3>

                {addButton && (
                    <Link to={addButton.link}>
                        <Button
                            variant="link"
                            size="sm"
                            className="px-3 rounded-full text-primary hover:bg-primary/10 hover:border-primary/30 border-dashed text-xs font-medium"
                        >
                            {addButton.icon}
                            {addButton.text}
                        </Button>
                    </Link>
                )}
            </div>

            <div className="bg-background rounded-xl border shadow-sm divide-y">
                {data.map(renderItem)}
            </div>
        </div>
    );
}
