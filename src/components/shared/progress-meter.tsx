import { cn } from "@/lib/utils";
export function ProgressMeter({ value, total, label, className, tone = "primary", }: {
    value: number;
    total: number;
    label: string;
    className?: string;
    tone?: "primary" | "success" | "muted";
}) {
    const safeTotal = total > 0 ? total : 0;
    const percent = safeTotal === 0 ? 0 : Math.min(100, (value / safeTotal) * 100);
    const complete = safeTotal > 0 && value >= safeTotal;
    return (<div className={cn("h-1.5 w-full overflow-hidden bg-scale-track", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={safeTotal} aria-label={label}>
 <div className={cn("h-full transition-[width] duration-300", complete || tone === "success" ? "bg-success" : null, !complete && tone === "primary" ? "bg-primary" : null, !complete && tone === "muted" ? "bg-muted-foreground/50" : null)} style={{ width: `${percent}%` }}/>
 </div>);
}
