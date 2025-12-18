import { Ticket, ArrowRight, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import GitHubIcon from '../icons/github'

export function AccessCTA() {
    return (
        <div className="max-w-5xl mx-auto px-6 mb-32">
            <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-muted/30 to-background p-12 md:p-20 text-center shadow-sm">

                {/* Ambient Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

                <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto space-y-8">

                    {/* Visual Anchor */}
                    <div className="h-16 w-16 bg-background rounded-2xl flex items-center justify-center shadow-sm border mb-2 rotate-3 group">
                        <Ticket className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform duration-500" />
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
                            Ready to parce?
                        </h2>

                        <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                            <p>
                                Parcener is currently in private beta.
                                <span className="text-foreground font-medium"> Sign in now</span> to automatically join the waitlist.
                            </p>

                            {/* Friend Invite Callout */}
                            <div className="flex items-center justify-center gap-2 text-sm bg-primary/5 border border-primary/10 rounded-full px-4 py-2 w-fit mx-auto text-primary/80">
                                <Users className="h-4 w-4" />
                                <span>Know someone already using Parcener? Ask them for an invite link.</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
                        <Link to="/login" className="w-full sm:w-auto">
                            <Button size="lg" className="h-12 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30  transition-all w-full">
                                Sign In to Join Waitlist
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>

                        <a href="https://github.com/cgorski03/parcener" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base font-medium border-2 bg-transparent hover:bg-muted w-full">
                                <GitHubIcon className="mr-2 h-4 w-4" />
                                Self Host Instead
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
