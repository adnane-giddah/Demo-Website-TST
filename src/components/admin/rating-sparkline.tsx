import { cn } from "@/lib/utils";
export function RatingSparkline({ distribution, label, className, }: {
    distribution: number[];
    label: string;
    className?: string;
}) {
    const peak = Math.max(...distribution, 1);
    const total = distribution.reduce((sum, count) => sum + count, 0);
    if (total === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }
    return (<span className={cn("flex h-6 items-end gap-px", className)} role="img" aria-label={`${label}: ${distribution
            .map((count, index) => (count > 0 ? `${count} at ${index + 1}` : null))
            .filter(Boolean)
            .join(", ")}`}>
 {distribution.map((count, index) => (<span key={index} className={cn("w-1.5 rounded-[1px]", count === 0 ? "bg-scale-track" : "bg-primary/70")} style={{ height: count === 0 ? "2px" : `${(count / peak) * 100}%` }}/>))}
 </span>);
}
