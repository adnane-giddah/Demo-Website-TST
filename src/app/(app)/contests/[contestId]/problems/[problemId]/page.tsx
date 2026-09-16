import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MathContent } from "@/components/math/math-content";
import { PageShell } from "@/components/shared/page-header";
import { RatingPanel } from "@/components/voting/rating-panel";
import { Separator } from "@/components/ui/separator";
import { requireApprovedUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { requireContestAccess } from "@/lib/permissions/contest-access";
import { getProblemForMember, listProblemsForMember, } from "@/lib/services/problem-service";
import { getOwnVoteForProblem } from "@/lib/services/vote-service";
import { cn } from "@/lib/utils";
type PageProps = {
    params: Promise<{
        contestId: string;
        problemId: string;
    }>;
};
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { problemId, contestId } = await params;
    try {
        const user = await requireApprovedUser();
        await requireContestAccess(user, contestId);
        const problem = await getProblemForMember(contestId, problemId);
        return { title: `Problem ${problem.position} — ${problem.title}` };
    }
    catch {
        return { title: "Problem" };
    }
}
export default async function ProblemPage({ params }: PageProps) {
    const user = await requireApprovedUser();
    const { contestId, problemId } = await params;
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
    let problem;
    try {
        problem = await getProblemForMember(contestId, problemId);
    }
    catch (error) {
        if (error instanceof NotFoundError)
            notFound();
        throw error;
    }
    const [siblings, ownVote] = await Promise.all([
        listProblemsForMember(contestId),
        getOwnVoteForProblem(user.id, problem.id),
    ]);
    const index = siblings.findIndex((candidate) => candidate.id === problem.id);
    const previous = index > 0 ? siblings[index - 1] : null;
    const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
    const lockedReason = !canVote
        ? "You have read access to this contest, but voting has not been enabled for you." : contest.status === "CLOSED" ? "Voting is closed. Your ratings are final and can no longer be changed." : contest.status === "ARCHIVED" ? "This contest is archived. Your ratings are kept for reference." : undefined;
    return (<PageShell width="reading" className="pb-20">
 <Link href={`/contests/${contestId}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 &lsaquo; {contest.title}
 </Link>

 
 <article className="mt-8">
 <header className="text-center">
 <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
 Problem {problem.position}
 </h1>
 <p className="mt-1.5 text-sm tracking-wide text-muted-foreground uppercase">
 {problem.title}
 </p>
 {problem.source ? (<p className="mt-1 text-xs text-muted-foreground/80">{problem.source}</p>) : null}
 </header>

 <div className="mt-8 rounded-lg border bg-paper px-5 py-7 sm:px-9 sm:py-10">
 <MathContent source={problem.statementLatex}/>
 </div>
 </article>

 <Separator className="my-10"/>

 <RatingPanel problemId={problem.id} initialBeauty={ownVote?.beauty ?? null} initialDifficulty={ownVote?.difficulty ?? null} canVote={votingOpen} lockedReason={lockedReason}/>

 <nav aria-label="Problem navigation" className="mt-12 flex items-stretch gap-3 border-t pt-6">
 <ProblemLink href={previous ? `/contests/${contestId}/problems/${previous.id}` : null} direction="previous" position={previous?.position} title={previous?.title}/>
 <ProblemLink href={next ? `/contests/${contestId}/problems/${next.id}` : null} direction="next" position={next?.position} title={next?.title}/>
 </nav>
 </PageShell>);
}
function ProblemLink({ href, direction, position, title, }: {
    href: string | null;
    direction: "previous" | "next";
    position?: number;
    title?: string;
}) {
    const isNext = direction === "next";
    if (!href) {
        return <div className="flex-1" aria-hidden/>;
    }
    return (<Link href={href} className={cn("group flex flex-1 items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/35", isNext && "flex-row-reverse text-right")}>
 <span className="min-w-0">
 <span className="block text-xs text-muted-foreground">
 {isNext ? "Next problem" : "Previous problem"}
 </span>
 <span className="block truncate text-sm font-medium">
 {position}. {title}
 </span>
 </span>
 </Link>);
}
