import "server-only";
import { Prisma, type ContestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/permissions/capabilities";
export type ContestAccess = {
    contest: {
        id: string;
        title: string;
        description: string | null;
        eventDate: Date | null;
        status: ContestStatus;
        createdAt: Date;
        updatedAt: Date;
    };
    canView: boolean;
    canVote: boolean;
    votingOpen: boolean;
    weight: Prisma.Decimal;
    isAdmin: boolean;
};
export async function getContestAccess(user: SessionUser, contestId: string): Promise<ContestAccess | null> {
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
        },
    });
    if (!contest)
        return null;
    const isAdmin = isAdminRole(user.role);
    const permission = await prisma.contestPermission.findUnique({
        where: { userId_contestId: { userId: user.id, contestId } },
        select: { canView: true, canVote: true, weight: true },
    });
    const canView = isAdmin
        ? true
        : contest.status !== "DRAFT" && !!permission?.canView;
    const canVote = !!permission?.canVote && canView;
    const votingOpen = canVote && contest.status === "OPEN" && user.status === "APPROVED";
    return {
        contest,
        canView,
        canVote,
        votingOpen,
        weight: permission?.weight ?? new Prisma.Decimal(1),
        isAdmin,
    };
}
export async function requireContestAccess(user: SessionUser, contestId: string): Promise<ContestAccess> {
    const access = await getContestAccess(user, contestId);
    if (!access || !access.canView)
        throw new NotFoundError("Contest not found.");
    return access;
}
export async function requireVotingAccess(user: SessionUser, contestId: string): Promise<ContestAccess> {
    const access = await requireContestAccess(user, contestId);
    if (user.status !== "APPROVED") {
        throw new ForbiddenError("Your account is not approved for voting.");
    }
    if (!access.canVote) {
        throw new ForbiddenError("You do not have voting permission for this contest.");
    }
    if (access.contest.status !== "OPEN") {
        throw new ForbiddenError(access.contest.status === "CLOSED" || access.contest.status === "ARCHIVED" ? "Voting is closed for this contest." : "This contest is not open for voting.");
    }
    return access;
}
