import { errorResponse, jsonOk } from "@/lib/api";
import { requireCapability } from "@/lib/auth/current-user";
import { ValidationError } from "@/lib/errors";
import { getContestResults, getProblemVoteBreakdown, } from "@/lib/services/results-service";
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const contestId = url.searchParams.get("contestId");
        const problemId = url.searchParams.get("problemId");
        if (!contestId) {
            throw new ValidationError("A contestId is required.");
        }
        if (problemId) {
            await requireCapability("votes:read_all");
            const breakdown = await getProblemVoteBreakdown(contestId, problemId);
            return jsonOk(breakdown);
        }
        await requireCapability("results:read");
        const results = await getContestResults(contestId);
        return jsonOk(results);
    }
    catch (error) {
        return errorResponse(error);
    }
}
