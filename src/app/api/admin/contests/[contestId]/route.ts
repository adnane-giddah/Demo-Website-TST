import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { deleteContest, getContestForAdmin, updateContest, } from "@/lib/services/contest-service";
import { contestUpdateSchema } from "@/lib/validation/schemas";
type RouteContext = {
    params: Promise<{
        contestId: string;
    }>;
};
export async function GET(_request: Request, { params }: RouteContext) {
    try {
        await requireCapability("contest:read_all");
        const { contestId } = await params;
        const contest = await getContestForAdmin(contestId);
        return jsonOk({ contest });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const actor = await requireCapability("contest:update");
        const { contestId } = await params;
        const input = await readJson(request, contestUpdateSchema);
        const contest = await updateContest(actor, contestId, input);
        return jsonOk({ contest });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function DELETE(_request: Request, { params }: RouteContext) {
    try {
        const actor = await requireCapability("contest:delete");
        const { contestId } = await params;
        const contest = await deleteContest(actor, contestId);
        return jsonOk({ contest });
    }
    catch (error) {
        return errorResponse(error);
    }
}
