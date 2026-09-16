import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { reorderProblems } from "@/lib/services/problem-service";
import { problemReorderSchema } from "@/lib/validation/schemas";
export async function POST(request: Request, { params }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    try {
        const actor = await requireCapability("problem:reorder");
        const { contestId } = await params;
        const { orderedIds } = await readJson(request, problemReorderSchema);
        const result = await reorderProblems(actor, contestId, orderedIds);
        return jsonOk(result);
    }
    catch (error) {
        return errorResponse(error);
    }
}
