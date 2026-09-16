import type { Metadata } from "next";
import Link from "next/link";
import { StatTile } from "@/components/admin/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/current-user";
import { listContestsForAdmin } from "@/lib/services/contest-service";
import { getAdminOverview, listRecentActivity, } from "@/lib/services/dashboard-service";
import { formatDateTime } from "@/lib/utils";
export const metadata: Metadata = { title: "Administration" };
export default async function AdminDashboardPage() {
    const admin = await requireAdmin();
    const [overview, contests, activity] = await Promise.all([
        getAdminOverview(),
        listContestsForAdmin(),
        listRecentActivity(7),
    ]);
    const liveContests = contests
        .filter((contest) => contest.status === "OPEN" || contest.status === "DRAFT")
        .slice(0, 4);
    return (<div className="space-y-8">
 <PageHeader title={`Good to see you, ${admin.name.split(" ")[0]}`} description="Here's what's happening across the platform right now." actions={<Button asChild size="sm">
 <Link href="/admin/contests/new">New contest</Link>
 </Button>}/>

 <section aria-label="Overview">
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <StatTile label="Contests open for voting" value={overview.activeContests} hint={overview.draftContests > 0 ? `${overview.draftContests} draft` : undefined} href="/admin/contests"/>
 <StatTile label="Accounts awaiting approval" value={overview.pendingUsers} tone="attention" href="/admin/users?status=PENDING"/>
 <StatTile label="Active voters" value={overview.activeVoters} hint={`of ${overview.totalMembers} members`}/>
 <StatTile label="Problems in the bank" value={overview.totalProblems}/>
 </div>
 </section>

 <div className="grid gap-6 lg:grid-cols-5">
 <section className="lg:col-span-3" aria-labelledby="live-contests">
 <div className="mb-3 flex items-center justify-between">
 <h2 id="live-contests" className="text-sm font-semibold tracking-tight">
 Contests in progress
 </h2>
 <Link href="/admin/contests" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 All contests
 </Link>
 </div>

 {liveContests.length === 0 ? (<EmptyState title="No contests in progress" description="Start one up and get the committee rating problems." action={<Button asChild size="sm">
 <Link href="/admin/contests/new">New contest</Link>
 </Button>}/>) : (<ul className="divide-y rounded-lg border bg-card">
 {liveContests.map((contest) => (<li key={contest.id}>
 <Link href={`/admin/contests/${contest.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/45">
 <span className="min-w-0 flex-1">
 <span className="flex items-center gap-2.5">
 <span className="truncate font-medium">{contest.title}</span>
 <ContestStatusBadge status={contest.status}/>
 </span>
 <span className="tabular mt-0.5 block text-xs text-muted-foreground">
 {contest.problemCount}{" "}
 {contest.problemCount === 1 ? "problem" : "problems"} ·{" "}
 {contest.voterCount}{" "}
 {contest.voterCount === 1 ? "voter" : "voters"}
 </span>
 </span>
 </Link>
 </li>))}
 </ul>)}
 </section>

 <section className="lg:col-span-2" aria-labelledby="recent-activity">
 <div className="mb-3 flex items-center justify-between">
 <h2 id="recent-activity" className="text-sm font-semibold tracking-tight">
 Recent activity
 </h2>
 <Link href="/admin/audit-log" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 Audit log
 </Link>
 </div>

 {activity.length === 0 ? (<EmptyState title="Nothing recorded yet" description="Things your team does will show up here as they happen." className="py-10"/>) : (<ol className="space-y-3 rounded-lg border bg-card p-4">
 {activity.map((entry) => (<li key={entry.id} className="border-b pb-3 last:border-0 last:pb-0">
 <p className="text-sm leading-relaxed">{entry.summary}</p>
 <p className="mt-0.5 text-xs text-muted-foreground">
 {formatDateTime(entry.createdAt)}
 </p>
 </li>))}
 </ol>)}
 </section>
 </div>
 </div>);
}
