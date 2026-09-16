import { hash, verify } from "@node-rs/argon2";
const ARGON2_OPTIONS = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
} as const;
export function hashPassword(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
}
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
    try {
        return await verify(storedHash, password, ARGON2_OPTIONS);
    }
    catch {
        return false;
    }
}
export async function fakeVerifyPassword(): Promise<void> {
    await hash("timing-equalisation-placeholder", ARGON2_OPTIONS);
}
