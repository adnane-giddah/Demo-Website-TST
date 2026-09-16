import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import { formatWeight } from "@/lib/utils";
import type { PermissionUpdateInput } from "@/lib/validation/schemas";
export type ContestParticipant = {
    userId: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    status: "PENDING" | "APPROVED" | "SUSPENDED" | "REMOVED";
    canView: boolean;
    canVote: boolean;
    weight: string;
    votesCast: number;
};
export async function listContestParticipants(contestId: string): Promise<ContestParticipant[]> {
    const [users, permissions, voteCounts] = await Promise.all([
        prisma.user.findMany({
            where: { status: { in: ["APPROVED", "SUSPENDED"] } },
            orderBy: [{ name: "asc" }],
            select: { id: true, name: true, email: true, role: true, status: true },
        }),
        prisma.contestPermission.findMany({
            where: { contestId },
            select: { userId: true, canView: true, canVote: true, weight: true },
        }),
        prisma.vote.groupBy({
            by: ["userId"],
            where: { problem: { contestId } },
            _count: { _all: true },
        }),
    ]);
    const permissionByUser = new Map(permissions.map((p) => [p.userId, p]));
    const votesByUser = new Map(voteCounts.map((v) => [v.userId, v._count._all]));
    return users.map((user) => {
        const permission = permissionByUser.get(user.id);
        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            canView: permission?.canView ?? false,
            canVote: permission?.canVote ?? false,
            weight: (permission?.weight ?? new Prisma.Decimal(1)).toString(),
            votesCast: votesByUser.get(user.id) ?? 0,
        };
    });
}
export async function updateContestPermission(actor: SessionUser, contestId: string, input: PermissionUpdateInput) {
    const [contest, target] = await Promise.all([
        prisma.contest.findUnique({
            where: { id: contestId },
            select: { id: true, title: true },
        }),
        prisma.user.findUnique({
            where: { id: input.userId },
            select: { id: true, name: true, status: true },
        }),
    ]);
    if (!contest)
        throw new NotFoundError("Contest not found.");
    if (!target)
        throw new NotFoundError("User not found.");
    if (target.status === "PENDING") {
        throw new ValidationError("This account is still awaiting approval and cannot be added to a contest yet.");
    }
    if (target.status === "REMOVED") {
        throw new ValidationError("This account has been removed from the platform.");
    }
    const existing = await prisma.contestPermission.findUnique({
        where: { userId_contestId: { userId: input.userId, contestId } },
        select: { canView: true, canVote: true, weight: true },
    });
    const previous = {
        canView: existing?.canView ?? false,
        canVote: existing?.canVote ?? false,
        weight: existing?.weight ?? new Prisma.Decimal(1),
    };
    const next = {
        canView: input.canView ?? previous.canView,
        canVote: input.canVote ?? previous.canVote,
        weight: input.weight !== undefined ? new Prisma.Decimal(input.weight) : previous.weight,
    };
    if (input.canVote === true)
        next.canView = true;
    if (input.canView === false) {
        next.canView = false;
        next.canVote = false;
    }
    if (!next.canView)
        next.canVote = false;
    const permission = await prisma.contestPermission.upsert({
        where: { userId_contestId: { userId: input.userId, contestId } },
        create: {
            userId: input.userId,
            contestId,
            canView: next.canView,
            canVote: next.canVote,
            weight: next.weight,
        },
        update: { canView: next.canView, canVote: next.canVote, weight: next.weight },
        select: { canView: true, canVote: true, weight: true },
    });
    if (next.canView !== previous.canView) {
        await recordAudit({
            adminId: actor.id,
            action: next.canView
                ? AUDIT_ACTIONS.ACCESS_GRANTED
                : AUDIT_ACTIONS.ACCESS_REVOKED,
            summary: `${actor.name} ${next.canView ? "granted" : "revoked"} access for ${target.name} to "${contest.title}".`,
            targetType: "User",
            targetId: target.id,
            contestId,
        });
    }
    if (next.canVote !== previous.canVote) {
        await recordAudit({
            adminId: actor.id,
            action: next.canVote
                ? AUDIT_ACTIONS.VOTING_ENABLED
                : AUDIT_ACTIONS.VOTING_DISABLED,
            summary: `${actor.name} ${next.canVote ? "enabled" : "disabled"} voting for ${target.name} in "${contest.title}".`,
            targetType: "User",
            targetId: target.id,
            contestId,
        });
    }
    if (!next.weight.equals(previous.weight)) {
        await recordAudit({
            adminId: actor.id,
            action: AUDIT_ACTIONS.WEIGHT_CHANGED,
            summary: `${actor.name} changed the voting weight of ${target.name} in "${contest.title}" from ${formatWeight(previous.weight.toString())} to ${formatWeight(next.weight.toString())}.`,
            targetType: "User",
            targetId: target.id,
            contestId,
            metadata: {
                from: previous.weight.toString(),
                to: next.weight.toString(),
            },
        });
    }
    return {
        userId: input.userId,
        canView: permission.canView,
        canVote: permission.canVote,
        weight: permission.weight.toString(),
    };
}
export async function removeUserFromContest(actor: SessionUser, contestId: string, userId: string) {
    const [contest, target] = await Promise.all([
        prisma.contest.findUnique({
            where: { id: contestId },
            select: { id: true, title: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true },
        }),
    ]);
    if (!contest)
        throw new NotFoundError("Contest not found.");
    if (!target)
        throw new NotFoundError("User not found.");
    const result = await prisma.$transaction(async (tx) => {
        const deletedVotes = await tx.vote.deleteMany({
            where: { userId, problem: { contestId } },
        });
        await tx.contestPermission.deleteMany({ where: { userId, contestId } });
        await recordAudit({
            adminId: actor.id,
            action: AUDIT_ACTIONS.CONTEST_USER_REMOVED,
            summary: `${actor.name} removed ${target.name} from "${contest.title}", deleting ${deletedVotes.count} rating${deletedVotes.count === 1 ? "" : "s"}.`,
            targetType: "User",
            targetId: target.id,
            contestId,
            metadata: { deletedVotes: deletedVotes.count },
        }, tx);
        return { deletedVotes: deletedVotes.count };
    });
    return { userId, name: target.name, ...result };
}
