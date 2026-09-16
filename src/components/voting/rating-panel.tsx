"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RatingScale } from "@/components/voting/rating-scale";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { cn } from "@/lib/utils";
type SaveState = {
    kind: "idle";
} | {
    kind: "saving";
} | {
    kind: "saved";
} | {
    kind: "error";
    message: string;
};
type RatingPanelProps = {
    problemId: string;
    initialBeauty: number | null;
    initialDifficulty: number | null;
    canVote: boolean;
    lockedReason?: string;
};
export function RatingPanel({ problemId, initialBeauty, initialDifficulty, canVote, lockedReason, }: RatingPanelProps) {
    const router = useRouter();
    const [beauty, setBeauty] = useState<number | null>(initialBeauty);
    const [difficulty, setDifficulty] = useState<number | null>(initialDifficulty);
    const [state, setState] = useState<SaveState>({ kind: "idle" });
    const requestId = useRef(0);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const save = useCallback(async (patch: {
        beauty?: number;
        difficulty?: number;
    }, rollback: () => void) => {
        const id = ++requestId.current;
        setState({ kind: "saving" });
        try {
            await apiRequest("/api/votes", {
                method: "POST",
                body: { problemId, ...patch },
            });
            if (id !== requestId.current)
                return;
            setState({ kind: "saved" });
            if (savedTimer.current)
                clearTimeout(savedTimer.current);
            savedTimer.current = setTimeout(() => {
                setState((current) => (current.kind === "saved" ? { kind: "idle" } : current));
            }, 2400);
            router.refresh();
        }
        catch (error) {
            if (id !== requestId.current)
                return;
            rollback();
            setState({
                kind: "error",
                message: error instanceof ApiClientError
                    ? error.message
                    : "Couldn't save your rating — give it another try.",
            });
        }
    }, [problemId, router]);
    const onBeautyChange = (value: number) => {
        if (value === beauty)
            return;
        const previous = beauty;
        setBeauty(value);
        void save({ beauty: value }, () => setBeauty(previous));
    };
    const onDifficultyChange = (value: number) => {
        if (value === difficulty)
            return;
        const previous = difficulty;
        setDifficulty(value);
        void save({ difficulty: value }, () => setDifficulty(previous));
    };
    const bothRated = beauty !== null && difficulty !== null;
    return (<section aria-labelledby="rating-heading" className="space-y-6">
 <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
 <h2 id="rating-heading" className="text-base font-semibold tracking-tight">
 {canVote ? "How would you rate this problem?" : "Your ratings"}
 </h2>
 <SaveIndicator state={state} canVote={canVote} bothRated={bothRated}/>
 </div>

 {!canVote && lockedReason ? (<p className="rounded-md border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
 {lockedReason}
 </p>) : null}

 <RatingScale label="Beauty" description="How elegant, surprising or memorable is this problem?" endpoints={["Ordinary", "Beautiful"]} value={beauty} onChange={onBeautyChange} disabled={!canVote}/>

 <RatingScale label="Difficulty" description="How hard would this be for the intended contestants?" endpoints={["Accessible", "Very hard"]} value={difficulty} onChange={onDifficultyChange} disabled={!canVote}/>

 {canVote && !bothRated ? (<p className="text-xs text-muted-foreground">
 Rate both beauty and difficulty and you&rsquo;re done with this one.
 </p>) : null}
 </section>);
}
function SaveIndicator({ state, canVote, bothRated, }: {
    state: SaveState;
    canVote: boolean;
    bothRated: boolean;
}) {
    if (state.kind === "error") {
        return (<span role="alert" className="text-sm text-destructive">
 {state.message}
 </span>);
    }
    if (state.kind === "saving") {
        return <span className="text-sm text-muted-foreground">Saving…</span>;
    }
    if (state.kind === "saved") {
        return (<span className="text-sm font-medium text-success" aria-live="polite">
 Saved
 </span>);
    }
    if (!canVote)
        return null;
    return (<span className={cn("text-sm", bothRated ? "text-muted-foreground" : "text-muted-foreground/80")} aria-live="polite">
 {bothRated ? "Your ratings are saved" : "Ratings save automatically"}
 </span>);
}
