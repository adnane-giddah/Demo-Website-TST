import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { clientIdentifier, enforceRateLimit } from "@/lib/rate-limit";
import { registerUser } from "@/lib/services/auth-service";
import { registerSchema } from "@/lib/validation/schemas";
export async function POST(request: Request) {
    try {
        enforceRateLimit({
            name: "register",
            identifier: clientIdentifier(request),
            limit: 5,
            windowMs: 60 * 60 * 1000,
        });
        const input = await readJson(request, registerSchema);
        const user = await registerUser(input);
        return jsonOk({
            user: { id: user.id, name: user.name, email: user.email },
            message: "Your account has been created and is waiting for administrator approval.",
        }, 201);
    }
    catch (error) {
        return errorResponse(error);
    }
}
