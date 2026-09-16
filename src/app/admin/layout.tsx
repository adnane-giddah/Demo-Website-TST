import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandLock } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/permissions/capabilities";
import { prisma } from "@/lib/db";
export default async function AdminLayout({ children, }: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (!user)
        redirect("/login");
    if (user.status !== "APPROVED" || !isAdminRole(user.role))
        notFound();
    const pendingCount = await prisma.user.count({ where: { status: "PENDING" } });
    return (<div className="flex min-h-dvh flex-col">
 <header className="sticky top-0 z-40 border-b bg-background">
 <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
 <BrandLock href="/admin" subtitle="Administration"/>

 <div className="ml-auto flex items-center gap-1">
 <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
 <Link href="/dashboard">Member view</Link>
 </Button>
 <ThemeToggle />
 <UserMenu name={user.name} email={user.email} role={user.role}/>
 </div>
 </div>
 </header>

 <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 px-4 sm:px-6 lg:flex-row lg:gap-8">
 <aside className="border-b py-3 lg:w-56 lg:shrink-0 lg:border-b-0 lg:py-8">
 <div className="lg:sticky lg:top-20">
 <AdminNav pendingCount={pendingCount} isSuperAdmin={user.role === "SUPER_ADMIN"}/>
 </div>
 </aside>

 <main className="min-w-0 flex-1 py-8">{children}</main>
 </div>
 </div>);
}
