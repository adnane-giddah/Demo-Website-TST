import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { listContestParticipants, updateContestPermission, } from "@/lib/services/permission-service";
import { permissionUpdateSchema } from "@/lib/validation/schemas";
type RouteContext = {
    params: Promise<{
        contestId: string;
    }>;
};
export async function GET(_request: Request, { params }: RouteContext) {
    try {
        await requireCapability("permission:read");
        const { contestId } = await params;
        const participants = await listContestParticipants(contestId);
        return jsonOk({ participants });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const input = await readJson(request, permissionUpdateSchema);
        const capability = input.weight !== undefined ? "weight:update" : "permission:update";
        const actor = await requireCapability(capability);
        const { contestId } = await params;
        const permission = await updateContestPermission(actor, contestId, input);
        return jsonOk({ permission });
    }
    catch (error) {
        return errorResponse(error);
    }
}
