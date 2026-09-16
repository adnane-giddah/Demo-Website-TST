import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireApprovedUser } from "@/lib/auth/current-user";
import { listContestsForMember } from "@/lib/services/contest-service";
import { formatDate } from "@/lib/utils";
export const metadata: Metadata = { title: "My contests" };
export default async function DashboardPage() {
    const user = await requireApprovedUser();
    const contests = await listContestsForMember(user);
    const firstName = user.name.split(" ")[0];
    return (<PageShell>
 <PageHeader title={`Welcome, ${firstName}`} description="Here are the contests you've got access to. Only you can see your own ratings."/>

 <section className="mt-8" aria-labelledby="my-contests">
 <h2 id="my-contests" className="sr-only">
 My contests
 </h2>

 {contests.length === 0 ? (<EmptyState title="Nothing here yet" description="You don't have access to any contests right now. An administrator will add you in once a problem session is ready."/>) : (<ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
 {contests.map((contest) => {
                const complete = contest.problemCount > 0 && contest.ratedCount >= contest.problemCount;
                return (<li key={contest.id}>
 <Link href={`/contests/${contest.id}`} className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/35 focus-visible:border-primary/35">
 <div className="flex items-start justify-between gap-3">
 <h3 className="text-base font-semibold tracking-tight text-balance">
 {contest.title}
 </h3>
 <ContestStatusBadge status={contest.status}/>
 </div>

 {contest.description ? (<p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
 {contest.description}
 </p>) : null}

 <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <dt className="sr-only">Problems</dt>
 <dd className="tabular">
 {contest.problemCount}{" "}
 {contest.problemCount === 1 ? "problem" : "problems"}
 </dd>
 </div>
 {contest.eventDate ? (<div className="flex items-center gap-1.5">
 <dt className="sr-only">Date</dt>
 <dd>{formatDate(contest.eventDate)}</dd>
 </div>) : null}
 </dl>

 <div className="mt-auto pt-5">
 {contest.canVote ? (<>
 <div className="mb-1.5 flex items-baseline justify-between gap-2">
 <span className="text-xs font-medium text-muted-foreground">
 Your progress
 </span>
 <span className="tabular text-xs font-medium">
 {contest.ratedCount} / {contest.problemCount} rated
 </span>
 </div>
 <ProgressMeter value={contest.ratedCount} total={contest.problemCount} label={`${contest.ratedCount} of ${contest.problemCount} problems rated`}/>
 </>) : (<Badge variant="outline">View only</Badge>)}

 <div className="mt-4 flex items-center justify-between">
 <span className="text-sm font-medium text-primary">
 {contest.status === "OPEN" && contest.canVote
                        ? complete
                            ? "Review your ratings" : "Rate problems" : "Open contest"}
 </span>
 </div>
 </div>
 </Link>
 </li>);
            })}
 </ul>)}
 </section>
 </PageShell>);
}
