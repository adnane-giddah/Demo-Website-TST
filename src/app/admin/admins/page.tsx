import type { Metadata } from "next";
import { TableFilters } from "@/components/admin/table-filters";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge, UserStatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { requireCapability } from "@/lib/auth/current-user";
import { listUsers } from "@/lib/services/user-service";
import { formatDate } from "@/lib/utils";
export const metadata: Metadata = { title: "Administrators" };
export default async function AdminAdminsPage({ searchParams, }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const actor = await requireCapability("user:read");
    const params = await searchParams;
    const search = typeof params.search === "string" ? params.search : undefined;
    const [admins, candidates] = await Promise.all([
        listUsers({ search, role: "ADMIN" }).then(async (rows) => {
            const supers = await listUsers({ search, role: "SUPER_ADMIN" });
            return [...supers, ...rows];
        }),
        listUsers({ role: "USER", status: "APPROVED" }),
    ]);
    const isSuperAdmin = actor.role === "SUPER_ADMIN";
    return (<div className="space-y-6">
 <PageHeader title="Administrators" description={isSuperAdmin
            ? "Administrators manage contests, problems, permissions and weights. Only a Super Admin can appoint or remove them." : "Administrators manage contests, problems, permissions and weights. Only a Super Admin can appoint one."}/>

 <TableFilters searchPlaceholder="Search administrators..."/>

 {admins.length === 0 ? (<EmptyState title="No administrators found" description="Nobody matches that search."/>) : (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead className="hidden md:table-cell">Email</TableHead>
 <TableHead>Role</TableHead>
 <TableHead className="hidden lg:table-cell">Status</TableHead>
 <TableHead className="hidden xl:table-cell">Since</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {admins.map((user) => (<TableRow key={user.id}>
 <TableCell>
 <span className="block font-medium">{user.name}</span>
 <span className="mt-0.5 block truncate text-xs text-muted-foreground md:hidden">
 {user.email}
 </span>
 </TableCell>
 <TableCell className="hidden max-w-56 truncate text-muted-foreground md:table-cell">
 {user.email}
 </TableCell>
 <TableCell>
 <RoleBadge role={user.role}/>
 </TableCell>
 <TableCell className="hidden lg:table-cell">
 <UserStatusBadge status={user.status}/>
 </TableCell>
 <TableCell className="tabular hidden text-muted-foreground xl:table-cell">
 {formatDate(user.createdAt)}
 </TableCell>
 <TableCell className="text-right">
 <UserRowActions user={{
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                }} actorRole={actor.role} actorId={actor.id}/>
 </TableCell>
 </TableRow>))}
 </TableBody>
 </Table>
 </div>)}

 {isSuperAdmin ? (<section aria-labelledby="promote-heading" className="space-y-3">
 <div>
 <h2 id="promote-heading" className="text-sm font-semibold tracking-tight">
 Appoint an administrator
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Any approved member can be handed administrator rights. They&rsquo;ll keep
 their contest access and any ratings they&rsquo;ve already cast.
 </p>
 </div>

 {candidates.length === 0 ? (<EmptyState title="No eligible members" description="Approve someone first, and you'll be able to appoint them here." className="py-10"/>) : (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Member</TableHead>
 <TableHead className="hidden sm:table-cell">Email</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {candidates.slice(0, 12).map((user) => (<TableRow key={user.id}>
 <TableCell className="font-medium">{user.name}</TableCell>
 <TableCell className="hidden max-w-56 truncate text-muted-foreground sm:table-cell">
 {user.email}
 </TableCell>
 <TableCell className="text-right">
 <UserRowActions user={{
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        status: user.status,
                    }} actorRole={actor.role} actorId={actor.id}/>
 </TableCell>
 </TableRow>))}
 </TableBody>
 </Table>
 </div>)}
 </section>) : null}
 </div>);
}
