import { notFound } from "next/navigation";
import { ContestForm } from "@/components/admin/contest-form";
import { requireCapability } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
export default async function ContestSettingsPage({ params, }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("contest:update");
    const { contestId } = await params;
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { name: true } },
        },
    });
    if (!contest)
        notFound();
    return (<div className="space-y-8">
 <section className="space-y-4">
 <div>
 <h2 className="text-sm font-semibold tracking-tight">Contest details</h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Changing the status here has the same effect as the control at the top
 of the page.
 </p>
 </div>

 <ContestForm mode="edit" contest={{
            id: contest.id,
            title: contest.title,
            description: contest.description,
            eventDate: contest.eventDate,
            status: contest.status,
        }}/>
 </section>

 <section className="space-y-3 border-t pt-6">
 <h2 className="text-sm font-semibold tracking-tight">Record</h2>
 <dl className="grid max-w-md gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
 <dt className="text-muted-foreground">Created by</dt>
 <dd>{contest.createdBy?.name ?? "—"}</dd>
 <dt className="text-muted-foreground">Created</dt>
 <dd className="tabular">{formatDateTime(contest.createdAt)}</dd>
 <dt className="text-muted-foreground">Last updated</dt>
 <dd className="tabular">{formatDateTime(contest.updatedAt)}</dd>
 </dl>
 </section>
 </div>);
}
