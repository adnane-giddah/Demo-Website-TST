import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { plainAverage, ratingDistribution, weightedAverage, } from "@/lib/calculations/weighted";
export type ProblemResult = {
    id: string;
    position: number;
    title: string;
    beauty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
    difficulty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
    plainBeauty: number | null;
    plainDifficulty: number | null;
    ratedBy: number;
    beautyDistribution: number[];
    difficultyDistribution: number[];
};
export type ContestResults = {
    contest: {
        id: string;
        title: string;
        status: string;
    };
    problems: ProblemResult[];
    eligibleVoters: number;
    participatingVoters: number;
    completionRate: number;
};
async function loadEligibleWeights(contestId: string) {
    const permissions = await prisma.contestPermission.findMany({
        where: { contestId, canView: true },
        select: { userId: true, weight: true, canVote: true },
    });
    const weightByUser = new Map<string, Prisma.Decimal>(permissions.map((permission) => [permission.userId, permission.weight]));
    const eligibleVoters = permissions.filter((permission) => permission.canVote).length;
    return { weightByUser, eligibleVoters };
}
export async function getContestResults(contestId: string): Promise<ContestResults> {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, title: true, status: true },
    });
    if (!contest)
        throw new NotFoundError("Contest not found.");
    const [problems, { weightByUser, eligibleVoters }] = await Promise.all([
        prisma.problem.findMany({
            where: { contestId },
            orderBy: { position: "asc" },
            select: { id: true, position: true, title: true },
        }),
        loadEligibleWeights(contestId),
    ]);
    const votes = weightByUser.size === 0
        ? []
        : await prisma.vote.findMany({
            where: {
                problem: { contestId },
                userId: { in: [...weightByUser.keys()] },
            },
            select: {
                problemId: true,
                userId: true,
                beauty: true,
                difficulty: true,
            },
        });
    const votesByProblem = new Map<string, typeof votes>();
    const participants = new Set<string>();
    for (const vote of votes) {
        participants.add(vote.userId);
        const bucket = votesByProblem.get(vote.problemId);
        if (bucket)
            bucket.push(vote);
        else
            votesByProblem.set(vote.problemId, [vote]);
    }
    let completedPairs = 0;
    const results: ProblemResult[] = problems.map((problem) => {
        const problemVotes = votesByProblem.get(problem.id) ?? [];
        const samples = problemVotes.map((vote) => ({
            userId: vote.userId,
            weight: weightByUser.get(vote.userId) ?? new Prisma.Decimal(1),
            beauty: vote.beauty,
            difficulty: vote.difficulty,
        }));
        const ratedBy = problemVotes.filter((vote) => vote.beauty !== null && vote.difficulty !== null).length;
        completedPairs += ratedBy;
        return {
            id: problem.id,
            position: problem.position,
            title: problem.title,
            beauty: weightedAverage(samples.map((s) => ({ rating: s.beauty, weight: s.weight }))),
            difficulty: weightedAverage(samples.map((s) => ({ rating: s.difficulty, weight: s.weight }))),
            plainBeauty: plainAverage(samples.map((s) => s.beauty)),
            plainDifficulty: plainAverage(samples.map((s) => s.difficulty)),
            ratedBy,
            beautyDistribution: ratingDistribution(samples.map((s) => s.beauty)),
            difficultyDistribution: ratingDistribution(samples.map((s) => s.difficulty)),
        };
    });
    const totalPairs = eligibleVoters * problems.length;
    return {
        contest,
        problems: results,
        eligibleVoters,
        participatingVoters: participants.size,
        completionRate: totalPairs === 0 ? 0 : completedPairs / totalPairs,
    };
}
export type IndividualVote = {
    userId: string;
    name: string;
    email: string;
    beauty: number | null;
    difficulty: number | null;
    weight: string;
    updatedAt: Date | null;
    missing: boolean;
};
export async function getProblemVoteBreakdown(contestId: string, problemId: string): Promise<{
    problem: {
        id: string;
        position: number;
        title: string;
        statementLatex: string;
    };
    votes: IndividualVote[];
    beauty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
    difficulty: {
        average: number | null;
        count: number;
        totalWeight: number;
    };
}> {
    const problem = await prisma.problem.findFirst({
        where: { id: problemId, contestId },
        select: { id: true, position: true, title: true, statementLatex: true },
    });
    if (!problem)
        throw new NotFoundError("Problem not found.");
    const permissions = await prisma.contestPermission.findMany({
        where: { contestId, canView: true },
        select: {
            userId: true,
            weight: true,
            canVote: true,
            user: { select: { name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
    });
    const voteRows = await prisma.vote.findMany({
        where: { problemId },
        select: {
            userId: true,
            beauty: true,
            difficulty: true,
            updatedAt: true,
        },
    });
    const voteByUser = new Map(voteRows.map((vote) => [vote.userId, vote]));
    const votes: IndividualVote[] = permissions
        .filter((permission) => permission.canVote || voteByUser.has(permission.userId))
        .map((permission) => {
        const vote = voteByUser.get(permission.userId);
        return {
            userId: permission.userId,
            name: permission.user.name,
            email: permission.user.email,
            beauty: vote?.beauty ?? null,
            difficulty: vote?.difficulty ?? null,
            weight: permission.weight.toString(),
            updatedAt: vote?.updatedAt ?? null,
            missing: !vote || vote.beauty === null || vote.difficulty === null,
        };
    });
    const samples = votes.map((vote) => ({
        beauty: vote.beauty,
        difficulty: vote.difficulty,
        weight: vote.weight,
    }));
    return {
        problem,
        votes,
        beauty: weightedAverage(samples.map((s) => ({ rating: s.beauty, weight: s.weight }))),
        difficulty: weightedAverage(samples.map((s) => ({ rating: s.difficulty, weight: s.weight }))),
    };
}
export async function getContestProgress(contestId: string) {
    const [problems, { eligibleVoters }] = await Promise.all([
        prisma.problem.findMany({
            where: { contestId },
            orderBy: { position: "asc" },
            select: {
                id: true,
                position: true,
                title: true,
                votes: {
                    select: { beauty: true, difficulty: true },
                },
            },
        }),
        loadEligibleWeights(contestId),
    ]);
    return {
        eligibleVoters,
        problems: problems.map((problem) => ({
            id: problem.id,
            position: problem.position,
            title: problem.title,
            ratedBy: problem.votes.filter((vote) => vote.beauty !== null && vote.difficulty !== null).length,
        })),
    };
}
