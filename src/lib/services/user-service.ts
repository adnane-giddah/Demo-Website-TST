import "server-only";
import type { Prisma, Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit, type AuditAction } from "@/lib/audit";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import { canManageUser, hasCapability } from "@/lib/permissions/capabilities";
export type UserFilters = {
    search?: string;
    status?: UserStatus | "ALL";
    role?: Role | "ALL";
};
export type ManagedUser = {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    contestCount: number;
};
export async function listUsers(filters: UserFilters = {}): Promise<ManagedUser[]> {
    const where: Prisma.UserWhereInput = {};
    if (filters.status && filters.status !== "ALL")
        where.status = filters.status;
    if (filters.role && filters.role !== "ALL")
        where.role = filters.role;
    const search = filters.search?.trim();
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    const users = await prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            _count: { select: { permissions: true } },
        },
    });
    return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        contestCount: user._count.permissions,
    }));
}
export async function countUsersByStatus() {
    const grouped = await prisma.user.groupBy({
        by: ["status"],
        _count: { _all: true },
    });
    const counts: Record<UserStatus, number> = {
        PENDING: 0,
        APPROVED: 0,
        SUSPENDED: 0,
        REMOVED: 0,
    };
    for (const row of grouped)
        counts[row.status] = row._count._all;
    return counts;
}
function describeStatusChange(actorName: string, targetName: string, from: UserStatus, to: UserStatus): {
    action: AuditAction;
    summary: string;
} | null {
    if (from === to)
        return null;
    if (to === "APPROVED") {
        return from === "PENDING" ? {
            action: AUDIT_ACTIONS.USER_APPROVED,
            summary: `${actorName} approved the account of ${targetName}.`,
        }
            : {
                action: AUDIT_ACTIONS.USER_REACTIVATED,
                summary: `${actorName} reactivated the account of ${targetName}.`,
            };
    }
    if (to === "SUSPENDED") {
        return {
            action: AUDIT_ACTIONS.USER_SUSPENDED,
            summary: `${actorName} suspended the account of ${targetName}.`,
        };
    }
    if (to === "REMOVED") {
        return from === "PENDING" ? {
            action: AUDIT_ACTIONS.USER_REJECTED,
            summary: `${actorName} rejected the account request of ${targetName}.`,
        }
            : {
                action: AUDIT_ACTIONS.USER_REMOVED,
                summary: `${actorName} removed the platform access of ${targetName}.`,
            };
    }
    return null;
}
export async function updateUser(actor: SessionUser, userId: string, input: {
    status?: UserStatus;
    role?: Role;
}) {
    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (!target)
        throw new NotFoundError("User not found.");
    if (!canManageUser(actor, target)) {
        throw new ForbiddenError(actor.id === target.id
            ? "You cannot change your own account here." : "You do not have permission to manage this account.");
    }
    const roleChanged = input.role !== undefined && input.role !== target.role;
    if (roleChanged) {
        const capability = input.role === "USER" ? "admin:revoke" : "admin:grant";
        if (!hasCapability(actor.role, capability)) {
            throw new ForbiddenError("Only a Super Admin can change administrator rights.");
        }
        if (input.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
            throw new ForbiddenError("Only a Super Admin can appoint another Super Admin.");
        }
    }
    const losesSuperAdmin = target.role === "SUPER_ADMIN" &&
        ((roleChanged && input.role !== "SUPER_ADMIN") ||
            (input.status !== undefined && input.status !== "APPROVED"));
    if (losesSuperAdmin) {
        const remaining = await prisma.user.count({
            where: {
                role: "SUPER_ADMIN",
                status: "APPROVED",
                id: { not: target.id },
            },
        });
        if (remaining === 0) {
            throw new ValidationError("This is the only active Super Admin. Appoint another one before changing this account.");
        }
    }
    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(input.status !== undefined ? { status: input.status } : {}),
            ...(input.role !== undefined ? { role: input.role } : {}),
        },
        select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (input.status !== undefined && input.status !== "APPROVED") {
        await destroyAllSessionsForUser(userId);
    }
    if (input.status !== undefined) {
        const change = describeStatusChange(actor.name, target.name, target.status, input.status);
        if (change) {
            await recordAudit({
                adminId: actor.id,
                action: change.action,
                summary: change.summary,
                targetType: "User",
                targetId: target.id,
                metadata: { from: target.status, to: input.status },
            });
        }
    }
    if (roleChanged) {
        const granting = input.role !== "USER";
        await recordAudit({
            adminId: actor.id,
            action: granting ? AUDIT_ACTIONS.ADMIN_GRANTED : AUDIT_ACTIONS.ADMIN_REVOKED,
            summary: granting
                ? `${actor.name} made ${target.name} ${input.role === "SUPER_ADMIN" ? "a Super Admin" : "an administrator"}.` : `${actor.name} removed administrator rights from ${target.name}.`,
            targetType: "User",
            targetId: target.id,
            metadata: { from: target.role, to: input.role },
        });
    }
    return updated;
}
