import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { requireApprovedUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { requireContestAccess } from "@/lib/permissions/contest-access";
import { listProblemsForMember } from "@/lib/services/problem-service";
import { countCompleted, getOwnVotesForContest } from "@/lib/services/vote-service";
import { formatDate } from "@/lib/utils";
type PageProps = {
    params: Promise<{
        contestId: string;
    }>;
};
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const user = await requireApprovedUser();
    const { contestId } = await params;
    try {
        const { contest } = await requireContestAccess(user, contestId);
        return { title: contest.title };
    }
    catch {
        return { title: "Contest" };
    }
}
export default async function ContestPage({ params }: PageProps) {
    const user = await requireApprovedUser();
    const { contestId } = await params;
    let access;
    try {
        access = await requireContestAccess(user, contestId);
    }
    catch (error) {
        if (error instanceof NotFoundError)
            notFound();
        throw error;
    }
    const { contest, canVote, votingOpen } = access;
    const [problems, ownVotes] = await Promise.all([
        listProblemsForMember(contestId),
        getOwnVotesForContest(user.id, contestId),
    ]);
    const completed = countCompleted(ownVotes);
    return (<PageShell width="reading">
 <PageHeader back={{ href: "/dashboard", label: "My contests" }} title={contest.title} description={contest.description} meta={<ContestStatusBadge status={contest.status}/>}/>

 <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
 <span className="tabular">
 {problems.length} {problems.length === 1 ? "problem" : "problems"}
 </span>
 {contest.eventDate ? <span>{formatDate(contest.eventDate)}</span> : null}
 {!canVote ? (<span>You can read this contest but not rate it</span>) : !votingOpen ? (<span>Voting is closed — your ratings are final</span>) : null}
 </div>

 {canVote && problems.length > 0 ? (<div className="mt-5 rounded-lg border bg-card p-4">
 <div className="flex items-baseline justify-between gap-3">
 <span className="text-sm font-medium">Your progress</span>
 <span className="tabular text-sm font-semibold">
 {completed} / {problems.length} problems rated
 </span>
 </div>
 <ProgressMeter className="mt-2.5" value={completed} total={problems.length} label={`${completed} of ${problems.length} problems rated`}/>
 </div>) : null}

 <section className="mt-8" aria-labelledby="problems-heading">
 <h2 id="problems-heading" className="sr-only">
 Problems
 </h2>

 {problems.length === 0 ? (<EmptyState title="No problems yet" description="Nobody's added any problems here yet. Check back once the organisers have put the set together."/>) : (<ol className="divide-y rounded-lg border bg-card">
 {problems.map((problem) => {
                const vote = ownVotes.get(problem.id);
                const rated = !!vote && vote.beauty !== null && vote.difficulty !== null;
                return (<li key={problem.id}>
 <Link href={`/contests/${contestId}/problems/${problem.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/45 sm:px-5">
 <span aria-hidden className="tabular w-7 shrink-0 font-serif text-lg text-muted-foreground">
 {problem.position}
 </span>

 <span className="min-w-0 flex-1">
 <span className="block truncate font-medium">
 <span className="sr-only">Problem {problem.position}: </span>
 {problem.title}
 </span>
 {problem.source ? (<span className="mt-0.5 block truncate text-xs text-muted-foreground">
 {problem.source}
 </span>) : null}
 </span>

 {canVote ? (rated ? (<span className="flex shrink-0 items-center gap-3">
 <span className="hidden items-center gap-2 sm:flex">
 <ScorePill label="B" value={vote.beauty}/>
 <ScorePill label="D" value={vote.difficulty}/>
 </span>
 <span className="text-xs text-success">Rated</span>
 </span>) : vote ? (<Badge variant="warning" className="shrink-0">
 Partly rated
 </Badge>) : (<span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
 Not rated
 </span>)) : null}
 </Link>
 </li>);
            })}
 </ol>)}
 </section>
 </PageShell>);
}
function ScorePill({ label, value }: {
    label: string;
    value: number | null;
}) {
    if (value === null)
        return null;
    return (<span className="tabular inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
 <span className="text-[0.625rem] tracking-wide uppercase opacity-70">
 {label}
 </span>
 {value}
 </span>);
}
