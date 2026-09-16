import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { createContest, listContestsForAdmin } from "@/lib/services/contest-service";
import { contestCreateSchema } from "@/lib/validation/schemas";
export async function GET(request: Request) {
    try {
        await requireCapability("contest:read_all");
        const url = new URL(request.url);
        const contests = await listContestsForAdmin({
            search: url.searchParams.get("search") ?? undefined,
            status: (url.searchParams.get("status") as "ALL" | undefined) ?? undefined,
        });
        return jsonOk({ contests });
    }
    catch (error) {
        return errorResponse(error);
    }
}
export async function POST(request: Request) {
    try {
        const actor = await requireCapability("contest:create");
        const input = await readJson(request, contestCreateSchema);
        const contest = await createContest(actor, input);
        return jsonOk({ contest }, 201);
    }
    catch (error) {
        return errorResponse(error);
    }
}
