import type { Metadata } from "next";
import type { Role, UserStatus } from "@prisma/client";
import { TableFilters } from "@/components/admin/table-filters";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge, UserStatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { requireCapability } from "@/lib/auth/current-user";
import { countUsersByStatus, listUsers } from "@/lib/services/user-service";
import { formatDate } from "@/lib/utils";
export const metadata: Metadata = { title: "Users" };
const STATUS_OPTIONS = [
    { value: "ALL", label: "All statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "REMOVED", label: "Removed" },
];
const ROLE_OPTIONS = [
    { value: "ALL", label: "All roles" },
    { value: "USER", label: "Members" },
    { value: "ADMIN", label: "Administrators" },
    { value: "SUPER_ADMIN", label: "Super Admins" },
];
export default async function AdminUsersPage({ searchParams, }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const actor = await requireCapability("user:read");
    const params = await searchParams;
    const search = typeof params.search === "string" ? params.search : undefined;
    const status = typeof params.status === "string" ? params.status : "ALL";
    const role = typeof params.role === "string" ? params.role : "ALL";
    const [users, counts] = await Promise.all([
        listUsers({
            search,
            status: status as UserStatus | "ALL",
            role: role as Role | "ALL",
        }),
        countUsersByStatus(),
    ]);
    return (<div className="space-y-6">
 <PageHeader title="Users" description={counts.PENDING > 0
            ? `${counts.PENDING} account${counts.PENDING === 1 ? "" : "s"} waiting on you to approve.` : "Everyone on the platform, and where they stand."}/>

 <TableFilters searchPlaceholder="Search users..." filters={[
            { name: "status", label: "Status", options: STATUS_OPTIONS },
            { name: "role", label: "Role", options: ROLE_OPTIONS },
        ]}/>

 {users.length === 0 ? (<EmptyState title="No users found" description="Nobody matches that search and those filters."/>) : (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Name</TableHead>
 <TableHead className="hidden md:table-cell">Email</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="hidden lg:table-cell">Role</TableHead>
 <TableHead className="hidden xl:table-cell">Created</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {users.map((user) => (<TableRow key={user.id}>
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
 <UserStatusBadge status={user.status}/>
 </TableCell>

 <TableCell className="hidden lg:table-cell">
 <RoleBadge role={user.role}/>
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
 </div>);
}
