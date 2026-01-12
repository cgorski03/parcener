import { ChevronRight, Plus, Receipt } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useRecentReceipts } from '../hooks/use-recents';
import { RecentList } from './recent-list-widget';

export function RecentUploads() {
  const { data, isLoading } = useRecentReceipts();

  return (
    <RecentList
      title="Recent Receipts"
      data={data}
      isLoading={isLoading}
      emptyState={{
        icon: (
          <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        ),
        title: 'No receipts yet',
        description: 'Start splitting bills with friends',
        cta: 'Scan Your First Receipt',
        ctaLink: '/upload',
      }}
      addButton={{
        link: '/upload',
        text: 'Scan New',
        icon: <Plus className="h-4 w-4 mr-1.5" />,
      }}
      renderItem={(receipt) => (
        <Link
          key={receipt.receiptId}
          to="/receipt/review/$receiptId"
          params={{ receiptId: receipt.receiptId }}
          className="flex items-center p-3 hover:bg-muted/50 transition-colors group"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
            <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          <div className="ml-3 flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-sm font-medium truncate text-foreground">
                {receipt.title}
              </h4>
              <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                <span>{receipt.createdAt?.toLocaleDateString()}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">
                ${receipt.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-2 shrink-0 group-hover:text-muted-foreground transition-colors" />
        </Link>
      )}
    />
  );
}
