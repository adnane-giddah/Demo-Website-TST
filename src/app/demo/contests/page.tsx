import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { DEMO_CONTESTS, DEMO_PROBLEMS } from "@/lib/demo/data";
export default function DemoContestsPage() {
    return (<div className="space-y-6">
 <PageHeader title="Contests" description="Every contest, with its status and problem count."/>
 <div className="grid gap-3 md:grid-cols-2">
 {DEMO_CONTESTS.map((c) => (<Link key={c.id} href={`/demo/contests/${c.id}`} className="block space-y-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/35">
 <div className="flex items-start justify-between gap-3">
 <h2 className="text-sm font-semibold">{c.title}</h2>
 <ContestStatusBadge status={c.status}/>
 </div>
 <p className="text-sm text-muted-foreground">{c.description}</p>
 <p className="text-xs text-muted-foreground">
 {DEMO_PROBLEMS.filter((p) => p.contestId === c.id).length} problems · {c.eventDate}
 </p>
 </Link>))}
 </div>
 </div>);
}
