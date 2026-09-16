import type { Metadata } from "next";
import Link from "next/link";
import { TableFilters } from "@/components/admin/table-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/current-user";
import { listAuditEntries } from "@/lib/services/dashboard-service";
import { formatDateTime } from "@/lib/utils";
export const metadata: Metadata = { title: "Audit log" };
const CATEGORY_OPTIONS = [
    { value: "ALL", label: "All activity" },
    { value: "user", label: "Accounts" },
    { value: "admin", label: "Administrators" },
    { value: "contest", label: "Contests" },
    { value: "problem", label: "Problems" },
    { value: "permission", label: "Permissions & weights" },
];
const PAGE_SIZE = 50;
const NOTABLE = new Set(["permission.weight_changed", "permission.user_removed_from_contest", "admin.granted", "admin.revoked", "contest.deleted",
]);
export default async function AuditLogPage({ searchParams, }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireCapability("audit:read");
    const params = await searchParams;
    const page = Math.max(1, Number(params.page) || 1);
    const category = typeof params.category === "string" ? params.category : "ALL";
    const search = typeof params.search === "string" ? params.search : undefined;
    const { entries, total } = await listAuditEntries({
        search,
        category,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
    });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const buildHref = (nextPage: number) => {
        const query = new URLSearchParams();
        if (search)
            query.set("search", search);
        if (category !== "ALL")
            query.set("category", category);
        if (nextPage > 1)
            query.set("page", String(nextPage));
        const qs = query.toString();
        return qs ? `/admin/audit-log?${qs}` : "/admin/audit-log";
    };
    return (<div className="space-y-6">
 <PageHeader title="Audit log" description="A running record of what your admins have done. Weights decide how much each rating counts, so we keep every change to them here."/>

 <TableFilters searchPlaceholder="Search the log..." filters={[
            { name: "category", label: "Activity", options: CATEGORY_OPTIONS },
        ]}/>

 {entries.length === 0 ? (<EmptyState title="Nothing recorded" description="Nothing matches those filters yet."/>) : (<>
 <ol className="divide-y rounded-lg border bg-card">
 {entries.map((entry) => {
                const metadata = entry.metadata as Record<string, unknown> | null;
                const from = metadata?.from;
                const to = metadata?.to;
                return (<li key={entry.id} className="flex gap-4 px-4 py-3.5 sm:px-5">
 <time dateTime={entry.createdAt.toISOString()} className="tabular hidden w-40 shrink-0 text-xs text-muted-foreground sm:block">
 {formatDateTime(entry.createdAt)}
 </time>

 <div className="min-w-0 flex-1">
 <p className="text-sm leading-relaxed">
 {entry.summary}
 {NOTABLE.has(entry.action) ? (<Badge variant="warning" className="ml-2 align-middle">
 {entry.action.startsWith("permission.weight")
                            ? "Weight" : entry.action.startsWith("admin.")
                            ? "Rights" : "Notable"}
 </Badge>) : null}
 </p>

 <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
 <span className="tabular sm:hidden">
 {formatDateTime(entry.createdAt)}
 </span>
 <code className="font-mono">{entry.action}</code>
 {from !== undefined && to !== undefined ? (<span className="tabular">
 {String(from)} &rarr; {String(to)}
 </span>) : null}
 {entry.contestId ? (<Link href={`/admin/contests/${entry.contestId}`} className="underline-offset-2 hover:text-foreground hover:underline">
 View contest
 </Link>) : null}
 </p>
 </div>
 </li>);
            })}
 </ol>

 {totalPages > 1 ? (<div className="flex items-center justify-between gap-3">
 <p className="tabular text-sm text-muted-foreground">
 Page {page} of {totalPages} · {total} entries
 </p>
 <div className="flex gap-2">
 <Button asChild variant="outline" size="sm" disabled={page <= 1}>
 <Link href={buildHref(page - 1)} aria-disabled={page <= 1}>
 Previous
 </Link>
 </Button>
 <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
 <Link href={buildHref(page + 1)} aria-disabled={page >= totalPages}>
 Next
 </Link>
 </Button>
 </div>
 </div>) : null}
 </>)}
 </div>);
}
