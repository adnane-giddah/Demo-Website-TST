"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoleBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import type { ContestParticipant } from "@/lib/services/permission-service";
import { cn, formatWeight } from "@/lib/utils";
import { WEIGHT_MAX, WEIGHT_MIN } from "@/lib/validation/schemas";
const ROW_GRID = "grid grid-cols-1 gap-x-4 gap-y-2.5 md:grid-cols-[minmax(0,1fr)_5rem_5rem_7rem_3rem] md:items-center md:gap-y-0";
function ControlCell({ label, align = "center", children, }: {
    label: string;
    align?: "center" | "start";
    children: React.ReactNode;
}) {
    return (<div className={cn("flex items-center justify-between gap-3", align === "center" ? "md:justify-center" : "md:justify-start")}>
 <span className="text-sm text-muted-foreground md:hidden">{label}</span>
 {children}
 </div>);
}
export function PermissionsTable({ contestId, participants: initial, }: {
    contestId: string;
    participants: ContestParticipant[];
}) {
    const router = useRouter();
    const [participants, setParticipants] = useState(initial);
    const [query, setQuery] = useState("");
    const [busyRow, setBusyRow] = useState<string | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<ContestParticipant | null>(null);
    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle)
            return participants;
        return participants.filter((participant) => participant.name.toLowerCase().includes(needle) ||
            participant.email.toLowerCase().includes(needle));
    }, [participants, query]);
    const withAccess = participants.filter((participant) => participant.canView).length;
    const withVoting = participants.filter((participant) => participant.canVote).length;
    const patch = async (userId: string, body: {
        canView?: boolean;
        canVote?: boolean;
        weight?: number;
    }, optimistic: (row: ContestParticipant) => ContestParticipant) => {
        const previous = participants;
        setParticipants((rows) => rows.map((row) => (row.userId === userId ? optimistic(row) : row)));
        setBusyRow(userId);
        try {
            const result = await apiRequest<{
                permission: {
                    userId: string;
                    canView: boolean;
                    canVote: boolean;
                    weight: string;
                };
            }>(`/api/admin/contests/${contestId}/permissions`, {
                method: "PATCH",
                body: { userId, ...body },
            });
            setParticipants((rows) => rows.map((row) => row.userId === userId
                ? {
                    ...row,
                    canView: result.permission.canView,
                    canVote: result.permission.canVote,
                    weight: result.permission.weight,
                }
                : row));
            router.refresh();
        }
        catch (error) {
            setParticipants(previous);
            toast.error(error instanceof ApiClientError
                ? error.message
                : "Couldn't update that.");
        }
        finally {
            setBusyRow(null);
        }
    };
    const removeFromContest = async (participant: ContestParticipant) => {
        try {
            const result = await apiRequest<{
                deletedVotes: number;
            }>(`/api/admin/contests/${contestId}/permissions/${participant.userId}`, { method: "DELETE" });
            setParticipants((rows) => rows.map((row) => row.userId === participant.userId
                ? { ...row, canView: false, canVote: false, weight: "1", votesCast: 0 }
                : row));
            toast.success(result.deletedVotes > 0
                ? `Removed ${participant.name} and their ${result.deletedVotes} rating${result.deletedVotes === 1 ? "" : "s"}.` : `Removed ${participant.name} from this contest.`);
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof ApiClientError
                ? error.message
                : "Couldn't remove them from the contest.");
        }
    };
    return (<div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="min-w-52 flex-1 sm:max-w-xs">
 <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members..." aria-label="Search members"/>
 </div>
 <p className="tabular text-sm text-muted-foreground">
 {withAccess} with access · {withVoting} can vote
 </p>
 </div>

 
 <div className="overflow-hidden rounded-lg border bg-card">
 <div className={cn(ROW_GRID, "hidden border-b px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid")}>
 <span>Member</span>
 <span className="text-center">Access</span>
 <span className="text-center">Voting</span>
 <span>Weight</span>
 <span className="sr-only">Actions</span>
 </div>

 {visible.length === 0 ? (<p className="px-4 py-10 text-center text-sm text-muted-foreground">
 No members match that search.
 </p>) : (<ul className="divide-y">
 {visible.map((participant) => {
                const busy = busyRow === participant.userId;
                return (<li key={participant.userId} className={cn(ROW_GRID, "px-4 py-3.5 transition-colors hover:bg-muted/45")}>
 <div className="min-w-0">
 <span className="flex items-center gap-2">
 <span className="truncate font-medium">{participant.name}</span>
 {participant.role !== "USER" ? (<RoleBadge role={participant.role}/>) : null}
 </span>
 <span className="mt-0.5 block truncate text-xs text-muted-foreground">
 {participant.email}
 {participant.votesCast > 0 ? (<span className="tabular">
 {"·"}
 {participant.votesCast} rating
 {participant.votesCast === 1 ? "" : "s"}
 </span>) : null}
 </span>
 </div>

 <ControlCell label="Access">
 <Switch checked={participant.canView} disabled={busy} aria-label={`Contest access for ${participant.name}`} onCheckedChange={(checked) => patch(participant.userId, { canView: checked }, (row) => ({
                        ...row,
                        canView: checked,
                        canVote: checked ? row.canVote : false,
                    }))}/>
 </ControlCell>

 <ControlCell label="Voting">
 <Switch checked={participant.canVote} disabled={busy} aria-label={`Voting permission for ${participant.name}`} onCheckedChange={(checked) => patch(participant.userId, { canVote: checked }, (row) => ({
                        ...row,
                        canVote: checked,
                        canView: checked ? true : row.canView,
                    }))}/>
 </ControlCell>

 <ControlCell label="Weight" align="start">
 {participant.canVote ? (<WeightInput value={participant.weight} disabled={busy} name={participant.name} onCommit={(weight) => patch(participant.userId, { weight }, (row) => ({
                            ...row,
                            weight: String(weight),
                        }))}/>) : (<span className="text-sm text-muted-foreground">—</span>)}
 </ControlCell>

 <div className="flex justify-end">
 {participant.canView || participant.votesCast > 0 ? (<Button variant="ghost" size="sm" disabled={busy} onClick={() => setPendingRemoval(participant)} aria-label={`Remove ${participant.name} from this contest`} className="text-muted-foreground hover:text-destructive md:size-8 md:p-0">
 <span aria-hidden className="hidden md:inline">
 &times;
 </span>
 <span className="md:hidden">
 {busy ? "Removing…" : "Remove from contest"}
 </span>
 </Button>) : null}
 </div>
 </li>);
            })}
 </ul>)}
 </div>

 <ConfirmDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)} options={pendingRemoval
            ? {
                title: `Remove ${pendingRemoval.name} from this contest?`,
                description: pendingRemoval.votesCast > 0
                    ? `This takes away their access and vote here, and deletes the ${pendingRemoval.votesCast} rating${pendingRemoval.votesCast === 1 ? "" : "s"} they cast — those stop counting towards the averages. Their account and other contests aren't touched.` : "This takes away their access and vote here. Their account and other contests aren't touched.",
                confirmLabel: "Remove",
                destructive: true,
            }
            : null} onConfirm={async () => {
            if (pendingRemoval)
                await removeFromContest(pendingRemoval);
        }}/>
 </div>);
}
function WeightInput({ value, onCommit, disabled, name, }: {
    value: string;
    onCommit: (weight: number) => void;
    disabled?: boolean;
    name: string;
}) {
    const canonical = formatWeight(value);
    const [draft, setDraft] = useState(canonical);
    const [lastCommitted, setLastCommitted] = useState(canonical);
    if (canonical !== lastCommitted) {
        setLastCommitted(canonical);
        setDraft(canonical);
    }
    const dirty = draft !== canonical;
    const commit = () => {
        const parsed = Number(draft);
        if (!Number.isFinite(parsed) || parsed < WEIGHT_MIN || parsed > WEIGHT_MAX) {
            setDraft(canonical);
            toast.error(`Weight must be between ${WEIGHT_MIN} and ${WEIGHT_MAX}.`);
            return;
        }
        const rounded = Math.round(parsed * 100) / 100;
        if (String(rounded) === canonical) {
            setDraft(canonical);
            return;
        }
        onCommit(rounded);
    };
    return (<Input type="number" inputMode="decimal" step="0.05" min={WEIGHT_MIN} max={WEIGHT_MAX} value={draft} disabled={disabled} aria-label={`Voting weight for ${name}`} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
            }
            if (event.key === "Escape") {
                setDraft(canonical);
                event.currentTarget.blur();
            }
        }} className={cn("tabular h-8 w-24", dirty && "border-warning")}/>);
}
