import type { Metadata } from "next";
import Link from "next/link";
import type { ContestStatus } from "@prisma/client";
import { TableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { requireCapability } from "@/lib/auth/current-user";
import { listContestsForAdmin } from "@/lib/services/contest-service";
import { formatDate } from "@/lib/utils";
export const metadata: Metadata = { title: "Contests" };
const STATUS_OPTIONS = [
    { value: "ALL", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "OPEN", label: "Open" },
    { value: "CLOSED", label: "Closed" },
    { value: "ARCHIVED", label: "Archived" },
];
export default async function AdminContestsPage({ searchParams, }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireCapability("contest:read_all");
    const params = await searchParams;
    const contests = await listContestsForAdmin({
        search: typeof params.search === "string" ? params.search : undefined,
        status: typeof params.status === "string" ? (params.status as ContestStatus | "ALL")
            : "ALL",
    });
    return (<div className="space-y-6">
 <PageHeader title="Contests" description="Put together problem sets, choose who can see them, and open them up for rating." actions={<Button asChild size="sm">
 <Link href="/admin/contests/new">New contest</Link>
 </Button>}/>

 <TableFilters searchPlaceholder="Search contests..." filters={[{ name: "status", label: "Status", options: STATUS_OPTIONS }]}/>

 {contests.length === 0 ? (<EmptyState title="No contests yet" description="Set up your first one and get the committee rating problems." action={<Button asChild size="sm">
 <Link href="/admin/contests/new">New contest</Link>
 </Button>}/>) : (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Contest</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="hidden text-right sm:table-cell">
 Problems
 </TableHead>
 <TableHead className="hidden text-right md:table-cell">
 Voters
 </TableHead>
 <TableHead className="hidden lg:table-cell">Date</TableHead>
 <TableHead className="hidden xl:table-cell">Created by</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {contests.map((contest) => (<TableRow key={contest.id}>
 <TableCell>
 <Link href={`/admin/contests/${contest.id}`} className="font-medium underline-offset-4 hover:underline">
 {contest.title}
 </Link>
 {contest.description ? (<span className="mt-0.5 line-clamp-1 block max-w-md text-xs text-muted-foreground">
 {contest.description}
 </span>) : null}
 </TableCell>

 <TableCell>
 <ContestStatusBadge status={contest.status}/>
 </TableCell>

 <TableCell className="tabular hidden text-right sm:table-cell">
 {contest.problemCount}
 </TableCell>

 <TableCell className="tabular hidden text-right md:table-cell">
 {contest.voterCount}
 <span className="text-muted-foreground">
 /{contest.authorisedCount}
 </span>
 </TableCell>

 <TableCell className="tabular hidden text-muted-foreground lg:table-cell">
 {contest.eventDate ? formatDate(contest.eventDate) : "—"}
 </TableCell>

 <TableCell className="hidden text-muted-foreground xl:table-cell">
 {contest.createdByName ?? "—"}
 </TableCell>
 </TableRow>))}
 </TableBody>
 </Table>
 </div>)}
 </div>);
}
