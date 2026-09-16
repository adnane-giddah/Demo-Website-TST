import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { env, isProduction } from "@/lib/env";
import { prisma } from "@/lib/db";
export const SESSION_COOKIE = "olympiad_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15;
function tokenToSessionId(token: string): string {
    return createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}
function generateToken(): string {
    return randomBytes(32).toString("base64url");
}
export type SessionContext = {
    userAgent?: string | null;
    ipAddress?: string | null;
};
export async function createSession(userId: string, context: SessionContext = {}) {
    const token = generateToken();
    const sessionId = tokenToSessionId(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.create({
        data: {
            id: sessionId,
            userId,
            expiresAt,
            userAgent: context.userAgent?.slice(0, 255) ?? null,
            ipAddress: context.ipAddress?.slice(0, 90) ?? null,
        },
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        expires: expiresAt,
    });
    return { token, expiresAt };
}
export async function readSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token)
        return null;
    const sessionId = tokenToSessionId(token);
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            expiresAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            },
        },
    });
    if (!session)
        return null;
    if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
        return null;
    }
    return session;
}
export async function renewSessionIfNeeded(sessionId: string, expiresAt: Date) {
    const remaining = expiresAt.getTime() - Date.now();
    if (remaining > SESSION_RENEW_THRESHOLD_MS)
        return;
    const nextExpiry = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session
        .update({ where: { id: sessionId }, data: { expiresAt: nextExpiry } })
        .catch(() => undefined);
    try {
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, cookieStore.get(SESSION_COOKIE)?.value ?? "", {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            path: "/",
            expires: nextExpiry,
        });
    }
    catch {
    }
}
export async function destroyCurrentSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
        await prisma.session
            .delete({ where: { id: tokenToSessionId(token) } })
            .catch(() => undefined);
    }
    cookieStore.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        maxAge: 0,
    });
}
export async function destroyAllSessionsForUser(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
}
