import Link from "next/link";
import { StatTile } from "@/components/admin/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { requireCapability } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { getContestProgress } from "@/lib/services/results-service";
export default async function ContestOverviewPage({ params, }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("contest:read_all");
    const { contestId } = await params;
    const [progress, permissionCounts] = await Promise.all([
        getContestProgress(contestId),
        prisma.contestPermission.findMany({
            where: { contestId },
            select: { canView: true, canVote: true },
        }),
    ]);
    const authorised = permissionCounts.filter((p) => p.canView).length;
    const voters = progress.eligibleVoters;
    const problemCount = progress.problems.length;
    const totalPairs = voters * problemCount;
    const completedPairs = progress.problems.reduce((total, problem) => total + problem.ratedBy, 0);
    const completion = totalPairs === 0 ? 0 : completedPairs / totalPairs;
    return (<div className="space-y-8">
 <section aria-label="Contest overview">
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <StatTile label="Problems" value={problemCount}/>
 <StatTile label="Authorised members" value={authorised}/>
 <StatTile label="Members who can vote" value={voters}/>
 <StatTile label="Voting completion" value={`${Math.round(completion * 100)}%`} hint={totalPairs === 0 ? undefined : `${completedPairs} of ${totalPairs}`}/>
 </div>
 </section>

 <section aria-labelledby="progress-heading" className="space-y-3">
 <div className="flex items-center justify-between gap-3">
 <h2 id="progress-heading" className="text-sm font-semibold tracking-tight">
 Rating progress by problem
 </h2>
 <Button asChild variant="outline" size="sm">
 <Link href={`/admin/contests/${contestId}/problems`}>
 Manage problems
 </Link>
 </Button>
 </div>

 {problemCount === 0 ? (<EmptyState title="No problems yet" description="Add whatever makes up this contest — you can always reorder them later." action={<Button asChild size="sm">
 <Link href={`/admin/contests/${contestId}/problems/new`}>
 Add problem
 </Link>
 </Button>}/>) : voters === 0 ? (<EmptyState title="Nobody can vote yet" description="Give access and turn on voting for whoever should be rating this set." action={<Button asChild size="sm">
 <Link href={`/admin/contests/${contestId}/users`}>
 Manage voters
 </Link>
 </Button>}/>) : (<div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="w-10 text-right">#</TableHead>
 <TableHead>Problem</TableHead>
 <TableHead className="w-40 hidden sm:table-cell">Progress</TableHead>
 <TableHead className="w-24 text-right">Votes</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {progress.problems.map((problem) => (<TableRow key={problem.id}>
 <TableCell className="tabular text-right text-muted-foreground">
 {problem.position}
 </TableCell>
 <TableCell>
 <Link href={`/admin/contests/${contestId}/problems/${problem.id}`} className="font-medium underline-offset-4 hover:underline">
 {problem.title}
 </Link>
 </TableCell>
 <TableCell className="hidden sm:table-cell">
 <ProgressMeter value={problem.ratedBy} total={voters} label={`${problem.ratedBy} of ${voters} voters have rated problem ${problem.position}`}/>
 </TableCell>
 <TableCell className="tabular text-right">
 <span className={problem.ratedBy < voters ? "text-warning" : undefined}>
 {problem.ratedBy}
 </span>
 <span className="text-muted-foreground"> / {voters}</span>
 </TableCell>
 </TableRow>))}
 </TableBody>
 </Table>
 </div>)}
 </section>
 </div>);
}
