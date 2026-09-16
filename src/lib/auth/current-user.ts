import "server-only";
import { cache } from "react";
import type { Role, UserStatus } from "@prisma/client";
import { readSession, renewSessionIfNeeded } from "@/lib/auth/session";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { hasCapability, isAdminRole, type Capability, } from "@/lib/permissions/capabilities";
export type SessionUser = {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
};
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
    const session = await readSession();
    if (!session)
        return null;
    if (session.user.status === "SUSPENDED" || session.user.status === "REMOVED") {
        return null;
    }
    await renewSessionIfNeeded(session.id, session.expiresAt);
    return session.user;
});
export async function requireUser(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user)
        throw new UnauthorizedError();
    return user;
}
export async function requireApprovedUser(): Promise<SessionUser> {
    const user = await requireUser();
    if (user.status !== "APPROVED") {
        throw new ForbiddenError("Your account is still waiting for administrator approval.");
    }
    return user;
}
export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireApprovedUser();
    if (!isAdminRole(user.role))
        throw new ForbiddenError();
    return user;
}
export async function requireCapability(capability: Capability): Promise<SessionUser> {
    const user = await requireApprovedUser();
    if (!hasCapability(user.role, capability))
        throw new ForbiddenError();
    return user;
}
export async function requireSuperAdmin(): Promise<SessionUser> {
    const user = await requireApprovedUser();
    if (user.role !== "SUPER_ADMIN")
        throw new ForbiddenError();
    return user;
}
export function userIsAdmin(user: Pick<SessionUser, "role"> | null): boolean {
    return !!user && isAdminRole(user.role);
}
