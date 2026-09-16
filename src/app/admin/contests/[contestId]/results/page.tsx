import Link from "next/link";
import { RatingSparkline } from "@/components/admin/rating-sparkline";
import { StatTile } from "@/components/admin/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { requireCapability } from "@/lib/auth/current-user";
import { getContestResults } from "@/lib/services/results-service";
import { cn, formatScore } from "@/lib/utils";
type SortKey = "position" | "beauty" | "difficulty";
const SORT_LABEL: Record<SortKey, string> = {
    position: "Problem number",
    beauty: "Beauty",
    difficulty: "Difficulty",
};
export default async function ContestResultsPage({ params, searchParams, }: {
    params: Promise<{
        contestId: string;
    }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireCapability("results:read");
    const { contestId } = await params;
    const query = await searchParams;
    const sort = (typeof query.sort === "string" && query.sort in SORT_LABEL ? query.sort : "position") as SortKey;
    const results = await getContestResults(contestId);
    const problems = [...results.problems].sort((a, b) => {
        if (sort === "position")
            return a.position - b.position;
        const left = sort === "beauty" ? a.beauty.average : a.difficulty.average;
        const right = sort === "beauty" ? b.beauty.average : b.difficulty.average;
        if (left === null && right === null)
            return a.position - b.position;
        if (left === null)
            return 1;
        if (right === null)
            return -1;
        return right - left;
    });
    const rated = problems.filter((problem) => problem.beauty.average !== null);
    const topBeauty = rated.length
        ? Math.max(...rated.map((problem) => problem.beauty.average ?? 0))
        : null;
    if (results.problems.length === 0) {
        return (<EmptyState title="No results yet" description="Add some problems and turn on voting, and you'll see the weighted averages show up here."/>);
    }
    return (<div className="space-y-6">
 <section aria-label="Results summary">
 <div className="grid gap-3 sm:grid-cols-3">
 <StatTile label="Problems" value={results.problems.length}/>
 <StatTile label="Voters taking part" value={results.participatingVoters} hint={`of ${results.eligibleVoters} eligible`}/>
 <StatTile label="Voting completion" value={`${Math.round(results.completionRate * 100)}%`}/>
 </div>
 </section>

 <section aria-labelledby="results-heading" className="space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 id="results-heading" className="text-sm font-semibold tracking-tight">
 Weighted averages
 </h2>
 <p className="text-xs text-muted-foreground">
 Sorted by {SORT_LABEL[sort].toLowerCase()}
 </p>
 </div>

 <div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="w-10 text-right">
 <SortHeader contestId={contestId} sort="position" active={sort} label="#"/>
 </TableHead>
 <TableHead>Problem</TableHead>
 <TableHead className="text-right">
 <SortHeader contestId={contestId} sort="beauty" active={sort} label="Beauty"/>
 </TableHead>
 <TableHead className="hidden w-24 sm:table-cell">Spread</TableHead>
 <TableHead className="text-right">
 <SortHeader contestId={contestId} sort="difficulty" active={sort} label="Difficulty"/>
 </TableHead>
 <TableHead className="hidden w-24 sm:table-cell">Spread</TableHead>
 <TableHead className="text-right">Rated</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {problems.map((problem) => {
            const isTop = topBeauty !== null &&
                problem.beauty.average !== null &&
                problem.beauty.average === topBeauty;
            return (<TableRow key={problem.id}>
 <TableCell className="tabular text-right text-muted-foreground">
 {problem.position}
 </TableCell>

 
 <TableCell className="max-w-0">
 <Link href={`/admin/contests/${contestId}/problems/${problem.id}`} className="block truncate font-medium underline-offset-4 hover:underline">
 {problem.title}
 </Link>
 </TableCell>

 <TableCell className="tabular text-right">
 <span className={cn("text-base font-semibold", isTop && "text-primary")}>
 {formatScore(problem.beauty.average)}
 </span>
 <span className="block text-[0.6875rem] text-muted-foreground">
 plain {formatScore(problem.plainBeauty)}
 </span>
 </TableCell>

 <TableCell className="hidden sm:table-cell">
 <RatingSparkline distribution={problem.beautyDistribution} label={`Beauty ratings for problem ${problem.position}`}/>
 </TableCell>

 <TableCell className="tabular text-right">
 <span className="text-base font-semibold">
 {formatScore(problem.difficulty.average)}
 </span>
 <span className="block text-[0.6875rem] text-muted-foreground">
 plain {formatScore(problem.plainDifficulty)}
 </span>
 </TableCell>

 <TableCell className="hidden sm:table-cell">
 <RatingSparkline distribution={problem.difficultyDistribution} label={`Difficulty ratings for problem ${problem.position}`}/>
 </TableCell>

 <TableCell className="tabular text-right text-muted-foreground">
 {problem.ratedBy}
 <span className="text-muted-foreground/70">
 /{results.eligibleVoters}
 </span>
 </TableCell>
 </TableRow>);
        })}
 </TableBody>
 </Table>
 </div>

 <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
 Weighted average = Σ(rating × weight) ÷ Σ(weight), computed on the
 server for each axis independently. &ldquo;Plain&rdquo; is the same
 figure with every voter counted equally. A rating counts while its
 author is part of the contest; removing someone from the contest
 deletes their ratings and takes them out of these numbers.
 </p>
 </section>
 </div>);
}
function SortHeader({ contestId, sort, active, label, }: {
    contestId: string;
    sort: SortKey;
    active: SortKey;
    label: string;
}) {
    const isActive = sort === active;
    return (<Link href={`/admin/contests/${contestId}/results?sort=${sort}`} aria-sort={isActive ? "descending" : "none"} className={cn("transition-colors hover:text-foreground", isActive && "text-foreground")}>
 {label}
 {isActive ? "▾" : null}
 </Link>);
}
