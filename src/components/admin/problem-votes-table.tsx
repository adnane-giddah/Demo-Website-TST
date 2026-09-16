import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import type { IndividualVote } from "@/lib/services/results-service";
import { formatScore, formatWeight } from "@/lib/utils";
export function ProblemVotesTable({ votes, beauty, difficulty, }: {
    votes: IndividualVote[];
    beauty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
    difficulty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
}) {
    if (votes.length === 0) {
        return (<EmptyState title="No voters yet" description="Nobody's been given voting permission here yet, so there's nothing to show." className="py-10"/>);
    }
    const outstanding = votes.filter((vote) => vote.missing).length;
    return (<div className="space-y-3">
 <div className="rounded-lg border bg-card">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Voter</TableHead>
 <TableHead className="text-right">Beauty</TableHead>
 <TableHead className="text-right">Difficulty</TableHead>
 <TableHead className="text-right">Weight</TableHead>
 </TableRow>
 </TableHeader>

 <TableBody>
 {votes.map((vote) => (<TableRow key={vote.userId}>
 <TableCell className="max-w-0">
 <span className="block truncate font-medium">{vote.name}</span>
 
 <span className="hidden truncate text-xs text-muted-foreground sm:block">
 {vote.email}
 </span>
 </TableCell>

 <TableCell className="tabular text-right">
 {vote.beauty === null ? (<span className="text-muted-foreground">—</span>) : (<span className="font-medium">{vote.beauty}</span>)}
 </TableCell>

 <TableCell className="tabular text-right">
 {vote.difficulty === null ? (<span className="text-muted-foreground">—</span>) : (<span className="font-medium">{vote.difficulty}</span>)}
 </TableCell>

 <TableCell className="tabular text-right text-muted-foreground">
 {formatWeight(vote.weight)}
 </TableCell>
 </TableRow>))}
 </TableBody>

 <TableFooter>
 <TableRow className="hover:bg-transparent">
 <TableCell className="text-xs tracking-wide text-muted-foreground uppercase">
 Weighted average
 </TableCell>
 <TableCell className="tabular text-right text-base font-semibold">
 {formatScore(beauty.average)}
 </TableCell>
 <TableCell className="tabular text-right text-base font-semibold">
 {formatScore(difficulty.average)}
 </TableCell>
 <TableCell className="tabular text-right text-xs text-muted-foreground">
 Σw {formatWeight(beauty.totalWeight)}
 </TableCell>
 </TableRow>
 </TableFooter>
 </Table>
 </div>

 {outstanding > 0 ? (<p className="text-xs text-muted-foreground">
 <Badge variant="warning" className="mr-1.5 tabular">
 {outstanding}
 </Badge>
 {outstanding === 1 ? "voter has" : "voters have"} not finished rating this
 problem. Unrated axes are excluded from the averages.
 </p>) : null}
 </div>);
}
