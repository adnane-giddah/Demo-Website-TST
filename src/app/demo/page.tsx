import Link from "next/link";
import { StatTile } from "@/components/admin/stat-tile";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { DEMO_ACTIVITY, DEMO_ADMIN, DEMO_CONTESTS, DEMO_PROBLEMS, DEMO_USERS } from "@/lib/demo/data";
export default function DemoDashboardPage() {
    const pending = DEMO_USERS.filter((u) => u.status === "PENDING").length;
    return (<div className="space-y-8">
 <PageHeader title={`Good to see you, ${DEMO_ADMIN.name.split(" ")[0]}`} description="Here's what's happening across the platform right now."/>
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <StatTile label="Contests open for voting" value={DEMO_CONTESTS.filter((c) => c.status === "OPEN").length} href="/demo/contests"/>
 <StatTile label="Problems" value={DEMO_PROBLEMS.length}/>
 <StatTile label="Approved members" value={DEMO_USERS.filter((u) => u.status === "APPROVED").length}/>
 <StatTile label="Waiting for approval" value={pending} tone="attention" href="/demo/users"/>
 </div>
 <div className="grid gap-6 lg:grid-cols-2">
 <section className="space-y-3">
 <h2 className="text-base font-semibold">Contests</h2>
 <ul className="divide-y rounded-lg border bg-card">
 {DEMO_CONTESTS.map((c) => (<li key={c.id}>
 <Link href={`/demo/contests/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
 <span className="text-sm font-medium">{c.title}</span>
 <ContestStatusBadge status={c.status}/>
 </Link>
 </li>))}
 </ul>
 </section>
 <section className="space-y-3">
 <h2 className="text-base font-semibold">Recent activity</h2>
 <ul className="divide-y rounded-lg border bg-card">
 {DEMO_ACTIVITY.map((a) => (<li key={a.text} className="px-4 py-3">
 <p className="text-sm">{a.text}</p>
 <p className="text-xs text-muted-foreground">{a.when}</p>
 </li>))}
 </ul>
 </section>
 </div>
 </div>);
}
