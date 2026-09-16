"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { cn } from "@/lib/utils";
export type AdminProblemRow = {
    id: string;
    position: number;
    title: string;
    source: string | null;
    hasPrivateNotes: boolean;
    voteCount: number;
};
export function ProblemList({ contestId, problems: initialProblems, }: {
    contestId: string;
    problems: AdminProblemRow[];
}) {
    const router = useRouter();
    const [problems, setProblems] = useState(initialProblems);
    const [lastServerList, setLastServerList] = useState(initialProblems);
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<AdminProblemRow | null>(null);
    if (initialProblems !== lastServerList) {
        setLastServerList(initialProblems);
        setProblems(initialProblems);
    }
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const persist = async (next: AdminProblemRow[], previous: AdminProblemRow[]) => {
        setSaving(true);
        try {
            await apiRequest(`/api/admin/contests/${contestId}/problems/reorder`, {
                method: "POST",
                body: { orderedIds: next.map((problem) => problem.id) },
            });
            router.refresh();
        }
        catch (error) {
            setProblems(previous);
            toast.error(error instanceof ApiClientError
                ? error.message
                : "Couldn't save the new order.");
        }
        finally {
            setSaving(false);
        }
    };
    const reorder = (from: number, to: number) => {
        if (to < 0 || to >= problems.length || from === to)
            return;
        const previous = problems;
        const next = arrayMove(problems, from, to).map((problem, index) => ({
            ...problem,
            position: index + 1,
        }));
        setProblems(next);
        void persist(next, previous);
    };
    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        reorder(problems.findIndex((problem) => problem.id === active.id), problems.findIndex((problem) => problem.id === over.id));
    };
    const deleteProblem = async (problem: AdminProblemRow) => {
        try {
            await apiRequest(`/api/admin/contests/${contestId}/problems/${problem.id}`, { method: "DELETE" });
            toast.success(`Deleted problem ${problem.position}.`);
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof ApiClientError ? error.message : "Couldn't delete the problem.");
        }
    };
    return (<div className="space-y-3">
 <div className="flex h-5 items-center justify-between">
 <p className="text-xs text-muted-foreground">
 Drag to reorder, or use the arrows. The order is what members see.
 </p>
 {saving ? (<span className="text-xs text-muted-foreground">Saving order…</span>) : null}
 </div>

 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
 <SortableContext items={problems.map((problem) => problem.id)} strategy={verticalListSortingStrategy}>
 <ul className="divide-y rounded-lg border bg-card">
 {problems.map((problem, index) => (<SortableProblem key={problem.id} problem={problem} contestId={contestId} onMoveUp={() => reorder(index, index - 1)} onMoveDown={() => reorder(index, index + 1)} isFirst={index === 0} isLast={index === problems.length - 1} onDelete={() => setPendingDelete(problem)}/>))}
 </ul>
 </SortableContext>
 </DndContext>

 <ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)} options={pendingDelete
            ? {
                title: `Delete problem ${pendingDelete.position}?`,
                description: pendingDelete.voteCount > 0
                    ? `This permanently deletes "${pendingDelete.title}" and the ${pendingDelete.voteCount} rating${pendingDelete.voteCount === 1 ? "" : "s"} cast for it. The remaining problems are renumbered.` : `This permanently deletes "${pendingDelete.title}". The remaining problems are renumbered.`,
                confirmLabel: "Delete problem",
                destructive: true,
            }
            : null} onConfirm={async () => {
            if (pendingDelete)
                await deleteProblem(pendingDelete);
        }}/>
 </div>);
}
function SortableProblem({ problem, contestId, onMoveUp, onMoveDown, isFirst, isLast, onDelete, }: {
    problem: AdminProblemRow;
    contestId: string;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: problem.id });
    return (<li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-2 bg-card px-2 py-2.5 sm:px-3", isDragging && "relative z-10 rounded-md")}>
 <button type="button" className="cursor-grab touch-none rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing" aria-label={`Reorder problem ${problem.position}: ${problem.title}`} {...attributes} {...listeners}>
 <span aria-hidden>&#8942;&#8942;</span>
 </button>

 <span className="tabular w-6 shrink-0 text-right font-serif text-base text-muted-foreground">
 {problem.position}
 </span>

 <div className="min-w-0 flex-1">
 <Link href={`/admin/contests/${contestId}/problems/${problem.id}`} className="block truncate font-medium underline-offset-4 hover:underline">
 {problem.title}
 </Link>
 <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
 {problem.source ? <span className="truncate">{problem.source}</span> : null}
 <span className="tabular">
 {problem.voteCount} {problem.voteCount === 1 ? "rating" : "ratings"}
 </span>
 {problem.hasPrivateNotes ? (<Badge variant="muted">Notes</Badge>) : null}
 </span>
 </div>

 <div className="flex shrink-0 items-center gap-0.5">
 <Button variant="ghost" size="icon-sm" onClick={onMoveUp} disabled={isFirst} aria-label={`Move problem ${problem.position} up`}>
 <span aria-hidden>&#9650;</span>
 </Button>
 <Button variant="ghost" size="icon-sm" onClick={onMoveDown} disabled={isLast} aria-label={`Move problem ${problem.position} down`}>
 <span aria-hidden>&#9660;</span>
 </Button>
 <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete problem ${problem.position}`} className="text-muted-foreground hover:text-destructive">
 <span aria-hidden>&times;</span>
 </Button>
 </div>
 </li>);
}
export function ProblemsLockedNotice() {
    return (<p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
 Voting&rsquo;s open right now, so editing or deleting a problem will mess with
 ratings people have already cast.
 </p>);
}
