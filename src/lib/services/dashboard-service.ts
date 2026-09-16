import "server-only";
import { prisma } from "@/lib/db";
export type AdminOverview = {
    activeContests: number;
    draftContests: number;
    pendingUsers: number;
    totalProblems: number;
    activeVoters: number;
    totalMembers: number;
};
export async function getAdminOverview(): Promise<AdminOverview> {
    const [activeContests, draftContests, pendingUsers, totalProblems, activeVoters, totalMembers,] = await Promise.all([
        prisma.contest.count({ where: { status: "OPEN" } }),
        prisma.contest.count({ where: { status: "DRAFT" } }),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.problem.count(),
        prisma.contestPermission
            .findMany({
            where: { canVote: true, contest: { status: "OPEN" } },
            select: { userId: true },
            distinct: ["userId"],
        })
            .then((rows) => rows.length),
        prisma.user.count({ where: { status: "APPROVED" } }),
    ]);
    return {
        activeContests,
        draftContests,
        pendingUsers,
        totalProblems,
        activeVoters,
        totalMembers,
    };
}
export type AuditFilters = {
    search?: string;
    category?: string;
    contestId?: string;
    take?: number;
    skip?: number;
};
export type AuditEntry = {
    id: string;
    action: string;
    summary: string;
    adminName: string | null;
    targetType: string | null;
    targetId: string | null;
    contestId: string | null;
    metadata: unknown;
    createdAt: Date;
};
export async function listAuditEntries(filters: AuditFilters = {}): Promise<{
    entries: AuditEntry[];
    total: number;
}> {
    const where: Record<string, unknown> = {};
    if (filters.category && filters.category !== "ALL") {
        where.action = { startsWith: `${filters.category}.` };
    }
    if (filters.contestId) {
        where.contestId = filters.contestId;
    }
    if (filters.search?.trim()) {
        where.summary = { contains: filters.search.trim(), mode: "insensitive" };
    }
    const take = Math.min(filters.take ?? 50, 200);
    const skip = filters.skip ?? 0;
    const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                action: true,
                summary: true,
                targetType: true,
                targetId: true,
                contestId: true,
                metadata: true,
                createdAt: true,
                admin: { select: { name: true } },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);
    return {
        total,
        entries: rows.map((row) => ({
            id: row.id,
            action: row.action,
            summary: row.summary,
            adminName: row.admin?.name ?? null,
            targetType: row.targetType,
            targetId: row.targetId,
            contestId: row.contestId,
            metadata: row.metadata,
            createdAt: row.createdAt,
        })),
    };
}
export async function listRecentActivity(limit = 8) {
    const { entries } = await listAuditEntries({ take: limit });
    return entries;
}
