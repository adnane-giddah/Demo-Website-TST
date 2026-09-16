import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/current-user";
import { updateUser } from "@/lib/services/user-service";
import { userUpdateSchema } from "@/lib/validation/schemas";
export async function PATCH(request: Request, { params }: {
    params: Promise<{
        userId: string;
    }>;
}) {
    try {
        const actor = await requireAdmin();
        const { userId } = await params;
        const input = await readJson(request, userUpdateSchema);
        const user = await updateUser(actor, userId, input);
        return jsonOk({ user });
    }
    catch (error) {
        return errorResponse(error);
    }
}
