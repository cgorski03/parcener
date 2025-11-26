import { ReactNode } from "react";
import { ArrowLeft, FileQuestion, Home, Plus, Receipt, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";

interface NotFoundShellProps {
    icon: ReactNode;
    title: string;
    message: string;
    actions?: ReactNode;
}

export function NotFoundShell({ icon, title, message, actions }: NotFoundShellProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Branding */}
            <div className="absolute top-8 flex items-center gap-2 text-foreground/80">
                <Receipt className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">Parcener</span>
            </div>

            <div className="w-full max-w-md text-center space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center border border-border">
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">{message}</p>
                </div>

                {/* Actions */}
                {actions && <div className="pt-4">{actions}</div>}
            </div>

            <div className="absolute bottom-8 text-[10px] text-muted-foreground/40">
                © {new Date().getFullYear()} Parcener. Built for friends.
            </div>
        </div>
    );
}

export function GeneralNotFound() {
    return (
        <NotFoundShell
            icon={<FileQuestion className="h-10 w-10 text-muted-foreground" />}
            title="Page Not Found"
            message="We couldn't find the page you're looking for. It may have been moved or doesn't exist."
            actions={
                <Button asChild>
                    <Link to="/">
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                    </Link>
                </Button>
            }
        />
    );
}


export function ReviewNotFound() {
    return (
        <NotFoundShell
            icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
            title="Receipt Not Found"
            message="This receipt may have been deleted, or the link is incorrect. Please check the URL and try again."
            actions={
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <Link to="/login">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            My Receipts
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link to="/upload">
                            <Plus className="h-4 w-4 mr-2" />
                            New Receipt
                        </Link>
                    </Button>
                </div>
            }
        />
    );
}


export function RoomNotFound() {
    return (
        <NotFoundShell
            icon={<Users className="h-10 w-10 text-muted-foreground" />}
            title="Room Not Found"
            message="This room may have been closed, expired, or the invite link is invalid. Create a new room to start splitting!"
            actions={
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2" />
                            Home
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link to="/upload">
                            <Plus className="h-4 w-4 mr-2" />
                            Upload receipt
                        </Link>
                    </Button>
                </div>
            }
        />
    );
}
