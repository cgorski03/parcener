import { CardFooter } from '@/components/ui/card'
import GitHubIcon from '@/components/icons/github'
import { Receipt } from 'lucide-react'
import { AppHeader } from './app-header'

interface PageShellProps {
    children: React.ReactNode
    className?: string
}

export function BrandedPageShell({ children, className = '' }: PageShellProps) {
    return (
        <div className={`min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col relative overflow-hidden ${className}`}>

            {/* Background decorations */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Centered Logo */}
            <AppHeader
                centerTitle={true}
                title={
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Receipt className="h-5 w-5 text-primary" />
                        <span className="text-lg font-bold tracking-tight">Parcener</span>
                    </div>
                }
            />

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center w-full p-4 pt-8 pb-8">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center px-4">
                <div className="text-[10px] text-muted-foreground/40 w-full max-w-md mx-auto">
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-muted to-transparent opacity-50" />
                    <CardFooter className="flex flex-col gap-4 py-6 bg-muted/10 rounded-lg mt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                            <GitHubIcon size={16} className="text-secondary" />
                            <span>Completely free & open source</span>
                        </div>
                    </CardFooter>
                    <div className="mt-4">
                        © {new Date().getFullYear()} Parcener. Built for friends.
                    </div>
                </div>
            </footer>
        </div>
    )
}
