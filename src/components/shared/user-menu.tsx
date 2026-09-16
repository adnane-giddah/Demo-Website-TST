"use client";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/client/api-client";
import { initialsOf } from "@/lib/utils";
export function UserMenu({ name, email, role, }: {
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [pending, startTransition] = useTransition();
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    const inAdminArea = pathname.startsWith("/admin");
    const signOut = () => {
        startTransition(async () => {
            await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => undefined);
            router.replace("/login");
            router.refresh();
        });
    };
    return (<DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-8 gap-2 px-1.5" aria-label={`Account menu for ${name}`}>
 <span aria-hidden className="flex size-6 items-center justify-center bg-secondary text-[0.6875rem] font-semibold text-secondary-foreground">
 {initialsOf(name)}
 </span>
 <span className="hidden max-w-32 truncate text-sm sm:inline">{name}</span>
 </Button>
 </DropdownMenuTrigger>

 <DropdownMenuContent align="end" className="w-56">
 <DropdownMenuLabel className="normal-case">
 <span className="block truncate text-sm font-medium text-foreground">
 {name}
 </span>
 <span className="block truncate text-xs font-normal text-muted-foreground">
 {email}
 </span>
 </DropdownMenuLabel>

 <DropdownMenuSeparator />

 {isAdmin ? (<DropdownMenuItem asChild>
 {inAdminArea ? (<Link href="/dashboard">Member view</Link>) : (<Link href="/admin">Administration</Link>)}
 </DropdownMenuItem>) : null}

 <DropdownMenuItem onSelect={signOut} disabled={pending}>
 Sign out
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>);
}
