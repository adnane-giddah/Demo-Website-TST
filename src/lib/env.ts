import { z } from "zod";
const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z
        .string()
        .min(32, "AUTH_SECRET must be at least 32 characters — generate one with `node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"`"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    return parsed.data;
}
export const env = loadEnv();
export const isProduction = env.NODE_ENV === "production";
