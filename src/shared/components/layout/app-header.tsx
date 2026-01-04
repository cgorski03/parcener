import { cn } from '@/shared/lib/utils'
import { ReactNode } from 'react'
import { AppNavigation } from './app-navigation'

interface AppHeaderProps {
    title?: ReactNode
    left?: ReactNode
    right?: ReactNode
    bottom?: ReactNode
    className?: string
    hideNav?: boolean
    centerTitle?: boolean
}

export function AppHeader({
    title,
    left,
    right,
    bottom,
    className,
    hideNav = false,
    centerTitle = false
}: AppHeaderProps) {
    const leftContent = left || (!hideNav && <AppNavigation />)

    return (
        <header className={cn(
            "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
            className
        )}>
            <div className="flex min-h-[3.5rem] items-center px-4 relative py-2">

                {/* Left Side */}
                <div className="flex items-center shrink-0 z-10">
                    {leftContent}
                </div>

                {/* Title Logic */}
                {centerTitle ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto font-semibold text-lg leading-none">
                            {title}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-w-0 px-3">
                        {title && <div className="font-semibold text-lg leading-none truncate">{title}</div>}
                    </div>
                )}

                {/* Right Side */}
                <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
                    {right}
                </div>
            </div>

            {bottom && (
                <div className="pb-3 animate-in slide-in-from-top-2 fade-in duration-300">
                    {bottom}
                </div>
            )}
        </header>
    )
}
