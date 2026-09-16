import { errorResponse, jsonOk, readJson } from "@/lib/api";
import { requireApprovedUser } from "@/lib/auth/current-user";
import { submitVote } from "@/lib/services/vote-service";
import { voteSchema } from "@/lib/validation/schemas";
export async function POST(request: Request) {
    try {
        const user = await requireApprovedUser();
        const input = await readJson(request, voteSchema);
        const vote = await submitVote(user, input);
        return jsonOk({
            vote: {
                problemId: vote.problemId,
                beauty: vote.beauty,
                difficulty: vote.difficulty,
                savedAt: vote.updatedAt,
            },
        });
    }
    catch (error) {
        return errorResponse(error);
    }
}
