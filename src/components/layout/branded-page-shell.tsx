import { CardFooter } from '../ui/card'
import GitHubIcon from '../icons/github'
import { Receipt } from 'lucide-react'

interface PageShellProps {
    children: React.ReactNode
    className?: string
}

export function BrandedPageShell({ children, className = '' }: PageShellProps) {
    return (
        <div className={`min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col p-4 relative overflow-hidden ${className}`}>
            {/* Background decorations */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-foreground/80">
                <Receipt className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">Parcener</span>
            </header>

            {/* Main content - grows to push footer down */}
            <main className="flex-1 flex items-center justify-center w-full pt-20 pb-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center">
                <div className="text-[10px] text-muted-foreground/40">
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50" />
                    <CardFooter className="flex flex-col gap-4 py-6 bg-muted/10">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <GitHubIcon size={16} className="text-secondary" />
                            <span>Completely free & open source</span>
                        </div>
                    </CardFooter>
                    © {new Date().getFullYear()} Parcener. Built for friends.
                </div>
            </footer>
        </div>
    )
}
