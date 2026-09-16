import { errorResponse, jsonOk } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { removeUserFromContest } from "@/lib/services/permission-service";
export async function DELETE(_request: Request, { params }: {
    params: Promise<{
        contestId: string;
        userId: string;
    }>;
}) {
    try {
        const actor = await requireCapability("permission:update");
        const { contestId, userId } = await params;
        const result = await removeUserFromContest(actor, contestId, userId);
        return jsonOk(result);
    }
    catch (error) {
        return errorResponse(error);
    }
}
