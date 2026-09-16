import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
export const AUDIT_ACTIONS = {
    USER_REGISTERED: "user.registered",
    USER_APPROVED: "user.approved",
    USER_REJECTED: "user.rejected",
    USER_SUSPENDED: "user.suspended",
    USER_REACTIVATED: "user.reactivated",
    USER_REMOVED: "user.removed",
    ADMIN_GRANTED: "admin.granted",
    ADMIN_REVOKED: "admin.revoked",
    CONTEST_CREATED: "contest.created",
    CONTEST_UPDATED: "contest.updated",
    CONTEST_DELETED: "contest.deleted",
    CONTEST_DUPLICATED: "contest.duplicated",
    CONTEST_STATUS_CHANGED: "contest.status_changed",
    PROBLEM_CREATED: "problem.created",
    PROBLEM_UPDATED: "problem.updated",
    PROBLEM_DELETED: "problem.deleted",
    PROBLEMS_REORDERED: "problem.reordered",
    ACCESS_GRANTED: "permission.access_granted",
    ACCESS_REVOKED: "permission.access_revoked",
    VOTING_ENABLED: "permission.voting_enabled",
    VOTING_DISABLED: "permission.voting_disabled",
    WEIGHT_CHANGED: "permission.weight_changed",
    CONTEST_USER_REMOVED: "permission.user_removed_from_contest",
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditEntryInput = {
    adminId: string | null;
    action: AuditAction;
    summary: string;
    targetType?: string | null;
    targetId?: string | null;
    contestId?: string | null;
    metadata?: Prisma.InputJsonValue | null;
};
type DbClient = PrismaClient | Prisma.TransactionClient;
export async function recordAudit(entry: AuditEntryInput, client: DbClient = prisma) {
    await client.auditLog.create({
        data: {
            adminId: entry.adminId,
            action: entry.action,
            summary: entry.summary,
            targetType: entry.targetType ?? null,
            targetId: entry.targetId ?? null,
            contestId: entry.contestId ?? null,
            metadata: entry.metadata ?? undefined,
        },
    });
}
