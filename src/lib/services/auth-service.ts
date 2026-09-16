import "server-only";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { fakeVerifyPassword, hashPassword, verifyPassword, } from "@/lib/auth/password";
import { createSession, type SessionContext } from "@/lib/auth/session";
import { ConflictError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { LoginInput, RegisterInput } from "@/lib/validation/schemas";
export async function registerUser(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
    });
    if (existing) {
        throw new ConflictError("An account with that email address already exists.");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: "USER",
            status: "PENDING",
        },
        select: { id: true, name: true, email: true },
    });
    await recordAudit({
        adminId: null,
        action: AUDIT_ACTIONS.USER_REGISTERED,
        summary: `${user.name} registered and is awaiting approval.`,
        targetType: "User",
        targetId: user.id,
    });
    return user;
}
const INVALID_CREDENTIALS = "That email or password doesn't match our records.";
export async function loginUser(input: LoginInput, context: SessionContext = {}) {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true,
        },
    });
    if (!user) {
        await fakeVerifyPassword();
        throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
        throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    if (user.status === "SUSPENDED") {
        throw new ForbiddenError("Your account's been suspended — reach out to an administrator to sort it out.");
    }
    if (user.status === "REMOVED") {
        throw new ForbiddenError("Your access here has been removed. An administrator can help if you think that's wrong.");
    }
    await createSession(user.id, context);
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    };
}
