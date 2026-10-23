import Link from "next/link";
import { ProblemList, ProblemsLockedNotice } from "@/components/admin/problem-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/current-user";
import { getContestHeader, listProblemRows } from "@/lib/services/admin-queries";
export default async function ContestProblemsPage({ params, }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("contest:read_all");
    const { contestId } = await params;
    const [contest, rows] = await Promise.all([
        getContestHeader(contestId),
        listProblemRows(contestId),
    ]);
    return (<div className="space-y-4">
 <div className="flex items-center justify-between gap-3">
 <h2 className="text-sm font-semibold tracking-tight">
 Problems{" "}
 <span className="tabular font-normal text-muted-foreground">
 ({rows.length})
 </span>
 </h2>
 <Button asChild size="sm">
 <Link href={`/admin/contests/${contestId}/problems/new`}>Add problem</Link>
 </Button>
 </div>

 {contest?.status === "OPEN" && rows.length > 0 ? <ProblemsLockedNotice /> : null}

 {rows.length === 0 ? (<EmptyState title="No problems yet" description="Write them up in LaTeX and add them here — you can reorder everything later." action={<Button asChild size="sm">
 <Link href={`/admin/contests/${contestId}/problems/new`}>
 Add the first problem
 </Link>
 </Button>}/>) : (<ProblemList contestId={contestId} problems={rows}/>)}
 </div>);
}
