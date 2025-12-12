import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Menu,
    PlusCircle,
    User,
    Receipt,
    LogOut,
    ChevronRight,
} from 'lucide-react'
import { Link, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import Github from '../icons/github'

export function AppNavigation() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { data: session } = authClient.useSession()
    const user = session?.user

    const handleLogout = async () => {
        await authClient.signOut()
        setOpen(false)
        router.invalidate()
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open Menu</span>
                </Button>
            </SheetTrigger>

            <SheetContent
                side="left"
                className="w-[300px] sm:w-[360px] p-0 flex flex-col  backdrop-blur-xl border-r"
            >
                {/* Texture using Shadcn variables only */}
                <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                    <div
                        className="absolute inset-0 opacity-[0.15]"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)) 1px, transparent 0)',
                            backgroundSize: '24px 24px'
                        }}
                    />
                </div>

                {/* Header */}
                <SheetHeader className="p-6 pb-4 text-left">
                    <SheetTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-foreground">Parcener</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                {/* Main Navigation Area */}
                <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6">

                    <div className="space-y-2">
                        <SectionLabel>Menu</SectionLabel>
                        <NavGroup>
                            <NavLink
                                to="/upload"
                                icon={PlusCircle}
                                label="New Receipt"
                                onClick={() => setOpen(false)}
                            />
                            <div className="pl-12 pr-4">
                                <Separator />
                            </div>
                            <NavLink
                                to="/account"
                                icon={User}
                                label="Account"
                                onClick={() => setOpen(false)}
                            />
                        </NavGroup>
                    </div>

                    <div className="space-y-2">
                        <SectionLabel>Links</SectionLabel>
                        <NavGroup>
                            <a
                                href="https://github.com/cgorski03/parcener"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/50 text-card-foreground"
                            >
                                <Github className="h-4.5 w-4.5 text-muted-foreground" />
                                <span className="flex-1">Open Source</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                            </a>
                        </NavGroup>
                    </div>
                </div>

                {/* Footer: User Card */}
                <div className="p-4 mt-auto border-t bg-background/80 backdrop-blur-sm">
                    {user ? (
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3 flex items-center gap-3">
                            <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={user.image || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                    {user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold leading-none truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                    {user.email}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button className="w-full shadow-sm" onClick={() => router.navigate({
                            to: '/login',
                            search: {
                                redirect: location.href,
                            },
                        })
                        }>
                            Sign In
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// --- Sub Components ---
function NavGroup({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col bg-card border text-card-foreground rounded-xl overflow-hidden shadow-sm">
            {children}
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {children}
        </div>
    )
}

function NavLink({ to, icon: Icon, label, onClick }: any) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all hover:bg-muted/50 relative text-card-foreground"
            activeProps={{ className: "text-primary font-semibold bg-primary/5 hover:bg-primary/10" }}
            onClick={onClick}
        >
            <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-foreground group-[.active]:text-primary transition-colors" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-[.active]:text-primary/50 group-hover:text-foreground/50 transition-colors" />
        </Link>
    )
}
