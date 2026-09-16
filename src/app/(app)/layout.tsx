import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLock } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser, userIsAdmin } from "@/lib/auth/current-user";
export default async function AppLayout({ children, }: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (!user)
        redirect("/login");
    if (user.status === "PENDING")
        redirect("/pending");
    if (user.status !== "APPROVED")
        redirect("/login");
    return (<div className="flex min-h-dvh flex-col">
 <header className="sticky top-0 z-40 border-b bg-background">
 <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
 <BrandLock href="/dashboard"/>

 <div className="ml-auto flex items-center gap-1">
 {userIsAdmin(user) ? (<Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
 <Link href="/admin">Administration</Link>
 </Button>) : null}
 <ThemeToggle />
 <UserMenu name={user.name} email={user.email} role={user.role}/>
 </div>
 </div>
 </header>

 <main className="flex-1">{children}</main>
 </div>);
}
