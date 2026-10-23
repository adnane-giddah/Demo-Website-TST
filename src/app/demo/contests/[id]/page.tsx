import { notFound } from "next/navigation";
import { MathContent } from "@/components/math/math-content";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { DEMO_CONTESTS, DEMO_PROBLEMS } from "@/lib/demo/data";
export default async function DemoContestPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;
    const contest = DEMO_CONTESTS.find((c) => c.id === id);
    if (!contest)
        notFound();
    const problems = DEMO_PROBLEMS.filter((p) => p.contestId === id);
    return (<div className="space-y-6">
 <PageHeader back={{ href: "/demo/contests", label: "Contests" }} title={contest.title} description={contest.description} meta={<ContestStatusBadge status={contest.status}/>}/>
 {problems.map((p, i) => (<article key={p.id} className="space-y-3 rounded-lg border bg-card p-5">
 <div className="flex flex-wrap items-baseline justify-between gap-2">
 <h2 className="text-sm font-semibold">{i + 1}. {p.title}</h2>
 <span className="text-xs text-muted-foreground">Source: {p.source}</span>
 </div>
 <MathContent source={p.statement}/>
 <dl className="flex flex-wrap gap-x-8 gap-y-1 border-t pt-3 text-sm">
 <div><dt className="inline text-muted-foreground">Beauty </dt><dd className="tabular inline font-medium">{p.votes ? p.beauty.toFixed(1) : "—"}</dd></div>
 <div><dt className="inline text-muted-foreground">Difficulty </dt><dd className="tabular inline font-medium">{p.votes ? p.difficulty.toFixed(1) : "—"}</dd></div>
 <div><dt className="inline text-muted-foreground">Votes </dt><dd className="tabular inline font-medium">{p.votes}</dd></div>
 </dl>
 </article>))}
 </div>);
}
