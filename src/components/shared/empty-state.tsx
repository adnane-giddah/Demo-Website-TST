import { cn } from "@/lib/utils";
export function EmptyState({ title, description, action, className, }: {
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) {
    return (<div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center", className)}>
 <h3 className="text-sm font-semibold tracking-tight">{title}</h3>

 {description ? (<p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
 {description}
 </p>) : null}

 {action ? <div className="mt-5">{action}</div> : null}
 </div>);
}
