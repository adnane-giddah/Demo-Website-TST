"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
type NavItem = {
    href: string;
    label: string;
    exact?: boolean;
    superAdminOnly?: boolean;
};
const ITEMS: NavItem[] = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/contests", label: "Contests" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/admins", label: "Administrators" },
    { href: "/admin/audit-log", label: "Audit log" },
    { href: "/admin/settings", label: "Settings" },
];
export function AdminNav({ pendingCount, isSuperAdmin, }: {
    pendingCount: number;
    isSuperAdmin: boolean;
}) {
    const pathname = usePathname();
    const isActive = (item: NavItem) => item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (<nav aria-label="Administration">
 <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
 {ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin).map((item) => {
            const active = isActive(item);
            return (<li key={item.href} className="shrink-0">
 <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors", active
                    ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
 {item.label}
 {item.href === "/admin/users" && pendingCount > 0 ? (<Badge variant="warning" className="ml-auto tabular">
 {pendingCount}
 </Badge>) : null}
 </Link>
 </li>);
        })}
 </ul>
 </nav>);
}
