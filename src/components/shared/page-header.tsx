import Link from "next/link";
import { cn } from "@/lib/utils";
export function PageHeader({ title, description, actions, back, meta, className, }: {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    back?: {
        href: string;
        label: string;
    };
    meta?: React.ReactNode;
    className?: string;
}) {
    return (<div className={cn("space-y-3", className)}>
 {back ? (<Link href={back.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 &lsaquo; {back.label}
 </Link>) : null}

 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0 space-y-1.5">
 <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
 <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
 {title}
 </h1>
 {meta}
 </div>
 {description ? (<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
 {description}
 </p>) : null}
 </div>

 {actions ? (<div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>) : null}
 </div>
 </div>);
}
export function PageShell({ children, className, width = "default", }: {
    children: React.ReactNode;
    className?: string;
    width?: "default" | "wide" | "reading";
}) {
    return (<div className={cn("mx-auto w-full px-4 py-8 sm:px-6 sm:py-10", width === "wide" && "max-w-7xl", width === "default" && "max-w-6xl", width === "reading" && "max-w-4xl", className)}>
 {children}
 </div>);
}
