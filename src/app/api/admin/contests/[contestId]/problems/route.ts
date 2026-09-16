import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { createProblem, listProblemsForAdmin, } from "@/lib/services/problem-service";
import { problemCreateSchema } from "@/lib/validation/schemas";
type RouteContext = {
    params: Promise<{
        contestId: string;
    }>;
};
export async function GET(_request: Request, { params }: RouteContext) {
    try {
        await requireCapability("contest:read_all");
        const { contestId } = await params;
        const problems = await listProblemsForAdmin(contestId);
        return jsonOk({ problems });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function POST(request: Request, { params }: RouteContext) {
    try {
        const actor = await requireCapability("problem:create");
        const { contestId } = await params;
        const input = await readJson(request, problemCreateSchema);
        const problem = await createProblem(actor, contestId, input);
        return jsonOk({ problem }, 201);
    }
    catch (error) {
        return errorResponse(error);
    }
}
