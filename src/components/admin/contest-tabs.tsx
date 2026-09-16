"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const SECTIONS = [
    { segment: "", label: "Overview" },
    { segment: "problems", label: "Problems" },
    { segment: "users", label: "Voters" },
    { segment: "results", label: "Results" },
    { segment: "settings", label: "Settings" },
];
export function ContestTabs({ contestId }: {
    contestId: string;
}) {
    const pathname = usePathname();
    const base = `/admin/contests/${contestId}`;
    return (<nav aria-label="Contest sections" className="-mb-px overflow-x-auto border-b">
 <ul className="flex min-w-max gap-1">
 {SECTIONS.map((section) => {
            const href = section.segment ? `${base}/${section.segment}` : base;
            const active = section.segment
                ? pathname.startsWith(href)
                : pathname === base;
            return (<li key={section.segment || "overview"}>
 <Link href={href} aria-current={active ? "page" : undefined} className={cn("-mb-px inline-flex border-b-2 px-3 py-2.5 text-sm font-medium transition-colors", active
                    ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground")}>
 {section.label}
 </Link>
 </li>);
        })}
 </ul>
 </nav>);
}
