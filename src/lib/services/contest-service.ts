import "server-only";
import type { ContestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import type { ContestCreateInput, } from "@/lib/validation/schemas";
const MEMBER_VISIBLE_STATUSES: ContestStatus[] = ["OPEN", "CLOSED", "ARCHIVED"];
export type MemberContestSummary = {
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    status: ContestStatus;
    problemCount: number;
    ratedCount: number;
    canVote: boolean;
};
export async function listContestsForMember(user: SessionUser): Promise<MemberContestSummary[]> {
    const permissions = await prisma.contestPermission.findMany({
        where: {
            userId: user.id,
            canView: true,
            contest: { status: { in: MEMBER_VISIBLE_STATUSES } },
        },
        select: {
            canVote: true,
            contest: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    eventDate: true,
                    status: true,
                    updatedAt: true,
                    _count: { select: { problems: true } },
                },
            },
        },
    });
    if (permissions.length === 0)
        return [];
    const contestIds = permissions.map((permission) => permission.contest.id);
    const ownVotes = await prisma.vote.findMany({
        where: {
            userId: user.id,
            beauty: { not: null },
            difficulty: { not: null },
            problem: { contestId: { in: contestIds } },
        },
        select: { problem: { select: { contestId: true } } },
    });
    const ratedByContest = new Map<string, number>();
    for (const vote of ownVotes) {
        const contestId = vote.problem.contestId;
        ratedByContest.set(contestId, (ratedByContest.get(contestId) ?? 0) + 1);
    }
    const rank = (status: ContestStatus) => status === "OPEN" ? 0 : status === "CLOSED" ? 1 : 2;
    const ordered = [...permissions].sort((a, b) => {
        const byStatus = rank(a.contest.status) - rank(b.contest.status);
        if (byStatus !== 0)
            return byStatus;
        return b.contest.updatedAt.getTime() - a.contest.updatedAt.getTime();
    });
    return ordered.map(({ canVote, contest }) => ({
        id: contest.id,
        title: contest.title,
        description: contest.description,
        eventDate: contest.eventDate,
        status: contest.status,
        problemCount: contest._count.problems,
        ratedCount: ratedByContest.get(contest.id) ?? 0,
        canVote,
    }));
}
export type AdminContestFilters = {
    search?: string;
    status?: ContestStatus | "ALL";
};
export type AdminContestSummary = {
    id: string;
    title: string;
    description: string | null;
    eventDate: Date | null;
    status: ContestStatus;
    createdAt: Date;
    updatedAt: Date;
    createdByName: string | null;
    problemCount: number;
    authorisedCount: number;
    voterCount: number;
};
export async function listContestsForAdmin(filters: AdminContestFilters = {}): Promise<AdminContestSummary[]> {
    const where: Prisma.ContestWhereInput = {};
    if (filters.status && filters.status !== "ALL") {
        where.status = filters.status;
    }
    if (filters.search?.trim()) {
        where.title = { contains: filters.search.trim(), mode: "insensitive" };
    }
    const contests = await prisma.contest.findMany({
        where,
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { name: true } },
            _count: { select: { problems: true } },
            permissions: { select: { canView: true, canVote: true } },
        },
    });
    return contests.map((contest) => ({
        id: contest.id,
        title: contest.title,
        description: contest.description,
        eventDate: contest.eventDate,
        status: contest.status,
        createdAt: contest.createdAt,
        updatedAt: contest.updatedAt,
        createdByName: contest.createdBy?.name ?? null,
        problemCount: contest._count.problems,
        authorisedCount: contest.permissions.filter((p) => p.canView).length,
        voterCount: contest.permissions.filter((p) => p.canVote).length,
    }));
}
export async function getContestForAdmin(contestId: string) {
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
            createdBy: { select: { id: true, name: true } },
        },
    });
    if (!contest)
        throw new NotFoundError("Contest not found.");
    return contest;
}
export async function createContest(actor: SessionUser, input: ContestCreateInput) {
    const contest = await prisma.contest.create({
        data: {
            title: input.title,
            description: input.description,
            eventDate: input.eventDate,
            status: input.status,
            createdById: actor.id,
        },
        select: { id: true, title: true, status: true },
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.CONTEST_CREATED,
        summary: `${actor.name} created the contest "${contest.title}".`,
        targetType: "Contest",
        targetId: contest.id,
        contestId: contest.id,
        metadata: { status: contest.status },
    });
    return contest;
}
export async function updateContest(actor: SessionUser, contestId: string, input: Partial<ContestCreateInput>) {
    const existing = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, title: true, status: true },
    });
    if (!existing)
        throw new NotFoundError("Contest not found.");
    const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.eventDate !== undefined ? { eventDate: input.eventDate } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
        },
        select: { id: true, title: true, status: true },
    });
    if (input.status !== undefined && input.status !== existing.status) {
        await recordAudit({
            adminId: actor.id,
            action: AUDIT_ACTIONS.CONTEST_STATUS_CHANGED,
            summary: `${actor.name} changed the status of "${contest.title}" from ${existing.status} to ${contest.status}.`,
            targetType: "Contest",
            targetId: contest.id,
            contestId: contest.id,
            metadata: { from: existing.status, to: contest.status },
        });
    }
    const changedFields = Object.keys(input).filter((key) => key !== "status");
    if (changedFields.length > 0) {
        await recordAudit({
            adminId: actor.id,
            action: AUDIT_ACTIONS.CONTEST_UPDATED,
            summary: `${actor.name} edited the contest "${contest.title}".`,
            targetType: "Contest",
            targetId: contest.id,
            contestId: contest.id,
            metadata: { fields: changedFields },
        });
    }
    return contest;
}
export async function deleteContest(actor: SessionUser, contestId: string) {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, title: true, _count: { select: { problems: true } } },
    });
    if (!contest)
        throw new NotFoundError("Contest not found.");
    await prisma.contest.delete({ where: { id: contestId } });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.CONTEST_DELETED,
        summary: `${actor.name} deleted the contest "${contest.title}".`,
        targetType: "Contest",
        targetId: contest.id,
        metadata: { problemCount: contest._count.problems },
    });
    return { id: contest.id, title: contest.title };
}
export async function duplicateContest(actor: SessionUser, contestId: string) {
    const source = await prisma.contest.findUnique({
        where: { id: contestId },
        select: {
            title: true,
            description: true,
            eventDate: true,
            problems: {
                orderBy: { position: "asc" },
                select: {
                    title: true,
                    statementLatex: true,
                    source: true,
                    privateNotes: true,
                    position: true,
                },
            },
            permissions: {
                select: { userId: true, canView: true, canVote: true, weight: true },
            },
        },
    });
    if (!source)
        throw new NotFoundError("Contest not found.");
    const copy = await prisma.contest.create({
        data: {
            title: `${source.title} (copy)`,
            description: source.description,
            eventDate: source.eventDate,
            status: "DRAFT",
            createdById: actor.id,
            problems: { create: source.problems },
            permissions: { create: source.permissions },
        },
        select: { id: true, title: true },
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.CONTEST_DUPLICATED,
        summary: `${actor.name} duplicated "${source.title}" as "${copy.title}".`,
        targetType: "Contest",
        targetId: copy.id,
        contestId: copy.id,
        metadata: { sourceContestId: contestId },
    });
    return copy;
}
