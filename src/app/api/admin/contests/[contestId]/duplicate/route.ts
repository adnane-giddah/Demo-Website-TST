import { errorResponse, jsonOk } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { duplicateContest } from "@/lib/services/contest-service";
export async function POST(_request: Request, { params }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    try {
        const actor = await requireCapability("contest:duplicate");
        const { contestId } = await params;
        const contest = await duplicateContest(actor, contestId);
        return jsonOk({ contest }, 201);
    }
    catch (error) {
        return errorResponse(error);
    }
}
