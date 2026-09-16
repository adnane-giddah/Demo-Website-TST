import { notFound } from "next/navigation";
import { ContestActions } from "@/components/admin/contest-actions";
import { ContestTabs } from "@/components/admin/contest-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ContestStatusBadge } from "@/components/shared/status-badge";
import { requireCapability } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
export default async function AdminContestLayout({ children, params, }: {
    children: React.ReactNode;
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("contest:read_all");
    const { contestId } = await params;
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            status: true,
            _count: { select: { problems: true } },
        },
    });
    if (!contest)
        notFound();
    return (<div className="space-y-6">
 <PageHeader back={{ href: "/admin/contests", label: "Contests" }} title={contest.title} description={contest.description} meta={<>
 <ContestStatusBadge status={contest.status}/>
 {contest.eventDate ? (<span className="tabular text-sm text-muted-foreground">
 {formatDate(contest.eventDate)}
 </span>) : null}
 </>} actions={<ContestActions contestId={contest.id} title={contest.title} status={contest.status} problemCount={contest._count.problems}/>}/>

 <ContestTabs contestId={contest.id}/>

 <div>{children}</div>
 </div>);
}
