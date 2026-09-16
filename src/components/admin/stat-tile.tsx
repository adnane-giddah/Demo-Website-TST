import Link from "next/link";
import { cn } from "@/lib/utils";
export function StatTile({ label, value, hint, href, tone = "default", }: {
    label: string;
    value: number | string;
    hint?: string;
    href?: string;
    tone?: "default" | "attention";
}) {
    const body = (<>
 <dt className="text-sm text-muted-foreground">{label}</dt>
 <dd className="mt-1.5 flex items-baseline gap-2">
 <span className={cn("tabular text-2xl font-semibold tracking-tight", tone === "attention" && value !== 0 && "text-warning")}>
 {value}
 </span>
 {hint ? (<span className="text-xs text-muted-foreground">{hint}</span>) : null}
 </dd>
 </>);
    const className = cn("block rounded-lg border bg-card px-4 py-3.5", href && "transition-colors hover:border-primary/35");
    if (href) {
        return (<Link href={href} className={className}>
 <dl>{body}</dl>
 </Link>);
    }
    return <dl className={className}>{body}</dl>;
}
