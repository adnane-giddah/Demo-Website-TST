import "server-only";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";
import { demoContest, demoCounts, demoPermissionFlags, demoProblemRows, demoSuperAdmins, demoOverview } from "@/lib/demo/store";
export async function countPendingUsers(): Promise<number> {
    if (await isDemoMode())
        return demoOverview().pendingUsers;
    return prisma.user.count({ where: { status: "PENDING" } });
}
export async function getContestHeader(contestId: string) {
    if (await isDemoMode())
        return demoContest(contestId);
    return prisma.contest.findUnique({
        where: { id: contestId },
        select: {
            id: true, title: true, description: true, eventDate: true, status: true,
            createdAt: true, updatedAt: true,
            createdBy: { select: { name: true } },
            _count: { select: { problems: true } },
        },
    });
}
export async function listContestPermissionFlags(contestId: string) {
    if (await isDemoMode())
        return demoPermissionFlags(contestId);
    return prisma.contestPermission.findMany({ where: { contestId }, select: { canView: true, canVote: true } });
}
export async function listProblemRows(contestId: string) {
    if (await isDemoMode())
        return demoProblemRows(contestId);
    const problems = await prisma.problem.findMany({
        where: { contestId },
        orderBy: { position: "asc" },
        select: { id: true, position: true, title: true, source: true, privateNotes: true, _count: { select: { votes: true } } },
    });
    return problems.map((problem) => ({
        id: problem.id, position: problem.position, title: problem.title, source: problem.source,
        hasPrivateNotes: !!problem.privateNotes, voteCount: problem._count.votes,
    }));
}
export async function getPlatformSnapshot() {
    if (await isDemoMode()) {
        const [userCount, contestCount, problemCount, voteCount, auditCount] = demoCounts();
        return { superAdmins: demoSuperAdmins(), userCount, contestCount, problemCount, voteCount, auditCount };
    }
    const [superAdmins, counts] = await Promise.all([
        prisma.user.findMany({
            where: { role: "SUPER_ADMIN" },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, email: true, status: true, createdAt: true },
        }),
        prisma.$transaction([prisma.user.count(), prisma.contest.count(), prisma.problem.count(), prisma.vote.count(), prisma.auditLog.count()]),
    ]);
    const [userCount, contestCount, problemCount, voteCount, auditCount] = counts;
    return { superAdmins, userCount, contestCount, problemCount, voteCount, auditCount };
}
