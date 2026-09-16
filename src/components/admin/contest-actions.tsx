"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ContestStatus } from "@prisma/client";
import { ConfirmDialog, type ConfirmOptions, } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
const STATUS_CONSEQUENCE: Record<ContestStatus, string> = {
    DRAFT: "It'll vanish from member dashboards until you open it back up.",
    OPEN: "Authorised members can read the problems, and anyone with voting permission can start rating.",
    CLOSED: "Members can still read everything and see their own ratings, but nobody can change a rating anymore.",
    ARCHIVED: "It gets filed away — no more voting, though admins can still dig through the results.",
};
export function ContestActions({ contestId, title, status, problemCount, }: {
    contestId: string;
    title: string;
    status: ContestStatus;
    problemCount: number;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<ContestStatus | null>(null);
    const [confirm, setConfirm] = useState<{
        options: ConfirmOptions;
        run: () => Promise<void>;
    } | null>(null);
    const changeStatus = async (next: ContestStatus) => {
        setBusy(true);
        try {
            await apiRequest(`/api/admin/contests/${contestId}`, {
                method: "PATCH",
                body: { status: next },
            });
            toast.success(next === "OPEN" ? "Voting's open now." : next === "CLOSED" ? "Voting's closed. Ratings are final." : `Contest set to ${next.toLowerCase()}.`);
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof ApiClientError
                ? error.message
                : "Couldn't change the contest status.");
        }
        finally {
            setBusy(false);
            setPendingStatus(null);
        }
    };
    const onStatusSelect = (value: string) => {
        const next = value as ContestStatus;
        if (next === status)
            return;
        setPendingStatus(next);
        setConfirm({
            options: {
                title: next === "OPEN" ? `Open "${title}" for voting?` : next === "CLOSED" ? `Close voting for "${title}"?` : `Set "${title}" to ${next.toLowerCase()}?`,
                description: STATUS_CONSEQUENCE[next],
                confirmLabel: next === "OPEN" ? "Open voting" : next === "CLOSED" ? "Close voting" : "Change status",
            },
            run: () => changeStatus(next),
        });
    };
    const duplicate = () => {
        setConfirm({
            options: {
                title: `Duplicate "${title}"?`,
                description: "We'll make a draft copy with the same problems and access list — just not the ratings.",
                confirmLabel: "Duplicate",
            },
            run: async () => {
                setBusy(true);
                try {
                    const result = await apiRequest<{
                        contest: {
                            id: string;
                        };
                    }>(`/api/admin/contests/${contestId}/duplicate`, { method: "POST" });
                    toast.success("Done — your copy is ready.");
                    router.push(`/admin/contests/${result.contest.id}`);
                }
                catch (error) {
                    toast.error(error instanceof ApiClientError ? error.message : "Couldn't duplicate it.");
                }
                finally {
                    setBusy(false);
                }
            },
        });
    };
    const remove = () => {
        setConfirm({
            options: {
                title: `Delete "${title}"?`,
                description: (<>
 This deletes the contest for good — its {problemCount}{" "}
 {problemCount === 1 ? "problem" : "problems"}, its access list, and every
 rating cast in it. There&rsquo;s no undo.
 </>) as React.ReactNode,
                confirmLabel: "Delete contest",
                destructive: true,
            },
            run: async () => {
                setBusy(true);
                try {
                    await apiRequest(`/api/admin/contests/${contestId}`, { method: "DELETE" });
                    toast.success("Gone. The contest has been deleted.");
                    router.push("/admin/contests");
                }
                catch (error) {
                    toast.error(error instanceof ApiClientError ? error.message : "Couldn't delete it.");
                }
                finally {
                    setBusy(false);
                }
            },
        });
    };
    return (<div className="flex items-center gap-2">
 <Select value={pendingStatus ?? status} onValueChange={onStatusSelect}>
 <SelectTrigger size="sm" className="w-40" aria-label="Contest status" disabled={busy}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="DRAFT">Draft</SelectItem>
 <SelectItem value="OPEN">Open for voting</SelectItem>
 <SelectItem value="CLOSED">Closed</SelectItem>
 <SelectItem value="ARCHIVED">Archived</SelectItem>
 </SelectContent>
 </Select>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="icon-sm" disabled={busy} aria-label="Contest actions">
 <span aria-hidden>&#8943;</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onSelect={duplicate}>
 Duplicate contest
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem variant="destructive" onSelect={remove}>
 Delete contest
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <ConfirmDialog open={confirm !== null} onOpenChange={(open) => {
            if (!open) {
                setConfirm(null);
                setPendingStatus(null);
            }
        }} options={confirm?.options ?? null} onConfirm={async () => {
            if (confirm)
                await confirm.run();
        }}/>
 </div>);
}
