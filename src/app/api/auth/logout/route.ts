import { errorResponse, jsonOk } from "@/lib/api";
import { destroyCurrentSession } from "@/lib/auth/session";
export async function POST() {
    try {
        await destroyCurrentSession();
        return jsonOk({ ok: true });
    }
    catch (error) {
        return errorResponse(error);
    }
}
