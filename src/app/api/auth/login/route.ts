import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { clientIdentifier, enforceRateLimit, resetRateLimit, } from "@/lib/rate-limit";
import { loginUser } from "@/lib/services/auth-service";
import { loginSchema } from "@/lib/validation/schemas";
export async function POST(request: Request) {
    const address = clientIdentifier(request);
    try {
        const input = await readJson(request, loginSchema);
        enforceRateLimit({
            name: "login:ip",
            identifier: address,
            limit: 20,
            windowMs: 15 * 60 * 1000,
        });
        enforceRateLimit({
            name: "login:account",
            identifier: input.email,
            limit: 8,
            windowMs: 15 * 60 * 1000,
        });
        const user = await loginUser(input, {
            userAgent: request.headers.get("user-agent"),
            ipAddress: address,
        });
        resetRateLimit("login:ip", address);
        resetRateLimit("login:account", input.email);
        return jsonOk({
            user,
            redirectTo: user.status === "PENDING" ? "/pending" : "/dashboard",
        });
    }
    catch (error) {
        return errorResponse(error);
    }
}
