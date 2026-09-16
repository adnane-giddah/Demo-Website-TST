import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { deleteProblem, updateProblem } from "@/lib/services/problem-service";
import { problemUpdateSchema } from "@/lib/validation/schemas";
type RouteContext = {
    params: Promise<{
        contestId: string;
        problemId: string;
    }>;
};
export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const actor = await requireCapability("problem:update");
        const { contestId, problemId } = await params;
        const input = await readJson(request, problemUpdateSchema);
        const problem = await updateProblem(actor, contestId, problemId, input);
        return jsonOk({ problem });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function DELETE(_request: Request, { params }: RouteContext) {
    try {
        const actor = await requireCapability("problem:delete");
        const { contestId, problemId } = await params;
        const problem = await deleteProblem(actor, contestId, problemId);
        return jsonOk({ problem });
    }
    catch (error) {
        return errorResponse(error);
    }
}
