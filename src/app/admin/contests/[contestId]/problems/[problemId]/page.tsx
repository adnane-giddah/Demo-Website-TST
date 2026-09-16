import Link from "next/link";
import { notFound } from "next/navigation";
import { ProblemEditor } from "@/components/admin/problem-editor";
import { ProblemVotesTable } from "@/components/admin/problem-votes-table";
import { Separator } from "@/components/ui/separator";
import { requireCapability } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { getProblemForAdmin } from "@/lib/services/problem-service";
import { getProblemVoteBreakdown } from "@/lib/services/results-service";
export default async function AdminProblemPage({ params, }: {
    params: Promise<{
        contestId: string;
        problemId: string;
    }>;
}) {
    await requireCapability("problem:update");
    const { contestId, problemId } = await params;
    let problem;
    try {
        problem = await getProblemForAdmin(contestId, problemId);
    }
    catch (error) {
        if (error instanceof NotFoundError)
            notFound();
        throw error;
    }
    const breakdown = await getProblemVoteBreakdown(contestId, problemId);
    return (<div className="space-y-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <Link href={`/admin/contests/${contestId}/problems`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 &lsaquo; All problems
 </Link>
 <span className="text-sm text-muted-foreground">
 Problem {problem.position}
 </span>
 </div>

 <ProblemEditor contestId={contestId} mode="edit" problem={{
            id: problem.id,
            position: problem.position,
            title: problem.title,
            statementLatex: problem.statementLatex,
            source: problem.source,
            privateNotes: problem.privateNotes,
        }}/>

 <Separator />

 <section aria-labelledby="individual-votes" className="space-y-3">
 <div>
 <h2 id="individual-votes" className="text-sm font-semibold tracking-tight">
 Individual ratings
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Who rated what, and the weight each voter carries in this contest.
 Members never see this.
 </p>
 </div>

 <ProblemVotesTable votes={breakdown.votes} beauty={breakdown.beauty} difficulty={breakdown.difficulty}/>
 </section>
 </div>);
}
