import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import { requireVotingAccess } from "@/lib/permissions/contest-access";
import type { VoteInput } from "@/lib/validation/schemas";
export type OwnVote = {
    problemId: string;
    beauty: number | null;
    difficulty: number | null;
    updatedAt: Date;
};
export async function submitVote(user: SessionUser, input: VoteInput): Promise<OwnVote> {
    const problem = await prisma.problem.findUnique({
        where: { id: input.problemId },
        select: { id: true, contestId: true },
    });
    if (!problem)
        throw new NotFoundError("Problem not found.");
    await requireVotingAccess(user, problem.contestId);
    const update: Prisma.VoteUpdateInput = {};
    if (input.beauty !== undefined)
        update.beauty = input.beauty;
    if (input.difficulty !== undefined)
        update.difficulty = input.difficulty;
    try {
        const vote = await prisma.vote.upsert({
            where: { userId_problemId: { userId: user.id, problemId: problem.id } },
            create: {
                userId: user.id,
                problemId: problem.id,
                beauty: input.beauty ?? null,
                difficulty: input.difficulty ?? null,
            },
            update,
            select: { problemId: true, beauty: true, difficulty: true, updatedAt: true },
        });
        return vote;
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            return prisma.vote.update({
                where: { userId_problemId: { userId: user.id, problemId: problem.id } },
                data: update,
                select: { problemId: true, beauty: true, difficulty: true, updatedAt: true },
            });
        }
        throw error;
    }
}
export async function getOwnVotesForContest(userId: string, contestId: string): Promise<Map<string, OwnVote>> {
    const votes = await prisma.vote.findMany({
        where: { userId, problem: { contestId } },
        select: { problemId: true, beauty: true, difficulty: true, updatedAt: true },
    });
    return new Map(votes.map((vote) => [vote.problemId, vote]));
}
export async function getOwnVoteForProblem(userId: string, problemId: string): Promise<OwnVote | null> {
    return prisma.vote.findUnique({
        where: { userId_problemId: { userId, problemId } },
        select: { problemId: true, beauty: true, difficulty: true, updatedAt: true },
    });
}
export function countCompleted(votes: Map<string, OwnVote>): number {
    let completed = 0;
    for (const vote of votes.values()) {
        if (vote.beauty !== null && vote.difficulty !== null)
            completed += 1;
    }
    return completed;
}
