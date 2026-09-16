import { renderLatexToHtml } from "@/lib/math/render-latex";
import { cn } from "@/lib/utils";
type MathContentProps = {
    source: string;
    className?: string;
    compact?: boolean;
};
export function MathContent({ source, className, compact }: MathContentProps) {
    const html = renderLatexToHtml(source);
    if (!html) {
        return (<p className={cn("text-sm text-muted-foreground italic", className)}>
 No statement yet.
 </p>);
    }
    return (<div className={cn("math-prose", compact && "math-compact", className)} dangerouslySetInnerHTML={{ __html: html }}/>);
}
