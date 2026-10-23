"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLock } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const ITEMS = [
    { href: "/demo", label: "Dashboard", exact: true },
    { href: "/demo/contests", label: "Contests" },
    { href: "/demo/users", label: "Users" },
];
export function DemoShell({ children }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    return (<div className="flex min-h-dvh flex-col">
 <div className="bg-primary px-4 py-2 text-center text-xs text-primary-foreground">
 Demo as an administrator: everything here is dummy data and nothing is saved.
 </div>
 <header className="sticky top-0 z-40 border-b bg-background">
 <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
 <BrandLock href="/demo" subtitle="Administration (demo)"/>
 <div className="ml-auto flex items-center gap-1">
 <ThemeToggle />
 <Button asChild variant="outline" size="sm">
 <Link href="/login">Exit demo</Link>
 </Button>
 </div>
 </div>
 </header>
 <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:flex-row lg:gap-8">
 <aside className="border-b py-3 lg:w-56 lg:shrink-0 lg:border-b-0 lg:py-8">
 <nav aria-label="Demo administration" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
 {ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (<Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors", active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
 {item.label}
 </Link>);
        })}
 </nav>
 </aside>
 <main className="min-w-0 flex-1 py-8">{children}</main>
 </div>
 </div>);
}
