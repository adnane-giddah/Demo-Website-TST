import "server-only";
import { cookies } from "next/headers";
import { ForbiddenError } from "@/lib/errors";
export const DEMO_COOKIE = "olympiad_demo";
export async function isDemoMode(): Promise<boolean> {
    const store = await cookies();
    return store.get(DEMO_COOKIE)?.value === "1";
}
/** Every write path calls this first, so the demo can never change anything. */
export async function assertNotDemo(): Promise<void> {
    if (await isDemoMode()) {
        throw new ForbiddenError("This is a read-only demo, so changes aren't saved. Request an account to try it for real.");
    }
}
