import "server-only";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import type { ProblemCreateInput } from "@/lib/validation/schemas";
const MEMBER_PROBLEM_FIELDS = {
    id: true,
    contestId: true,
    title: true,
    statementLatex: true,
    source: true,
    position: true,
} as const;
const ADMIN_PROBLEM_FIELDS = {
    ...MEMBER_PROBLEM_FIELDS,
    privateNotes: true,
    createdAt: true,
    updatedAt: true,
} as const;
export type MemberProblem = {
    id: string;
    contestId: string;
    title: string;
    statementLatex: string;
    source: string | null;
    position: number;
};
export async function listProblemsForMember(contestId: string): Promise<MemberProblem[]> {
    return prisma.problem.findMany({
        where: { contestId },
        orderBy: { position: "asc" },
        select: MEMBER_PROBLEM_FIELDS,
    });
}
export async function listProblemsForAdmin(contestId: string) {
    return prisma.problem.findMany({
        where: { contestId },
        orderBy: { position: "asc" },
        select: ADMIN_PROBLEM_FIELDS,
    });
}
export async function getProblemForMember(contestId: string, problemId: string) {
    const problem = await prisma.problem.findFirst({
        where: { id: problemId, contestId },
        select: MEMBER_PROBLEM_FIELDS,
    });
    if (!problem)
        throw new NotFoundError("Problem not found.");
    return problem;
}
export async function getProblemForAdmin(contestId: string, problemId: string) {
    const problem = await prisma.problem.findFirst({
        where: { id: problemId, contestId },
        select: ADMIN_PROBLEM_FIELDS,
    });
    if (!problem)
        throw new NotFoundError("Problem not found.");
    return problem;
}
export async function createProblem(actor: SessionUser, contestId: string, input: ProblemCreateInput) {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true, title: true },
    });
    if (!contest)
        throw new NotFoundError("Contest not found.");
    const last = await prisma.problem.findFirst({
        where: { contestId },
        orderBy: { position: "desc" },
        select: { position: true },
    });
    const problem = await prisma.problem.create({
        data: {
            contestId,
            title: input.title,
            statementLatex: input.statementLatex,
            source: input.source,
            privateNotes: input.privateNotes,
            position: (last?.position ?? 0) + 1,
        },
        select: ADMIN_PROBLEM_FIELDS,
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.PROBLEM_CREATED,
        summary: `${actor.name} added problem ${problem.position} ("${problem.title}") to "${contest.title}".`,
        targetType: "Problem",
        targetId: problem.id,
        contestId,
        metadata: { position: problem.position },
    });
    return problem;
}
export async function updateProblem(actor: SessionUser, contestId: string, problemId: string, input: Partial<ProblemCreateInput>) {
    const existing = await prisma.problem.findFirst({
        where: { id: problemId, contestId },
        select: { id: true, position: true, contest: { select: { title: true } } },
    });
    if (!existing)
        throw new NotFoundError("Problem not found.");
    const problem = await prisma.problem.update({
        where: { id: problemId },
        data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.statementLatex !== undefined
                ? { statementLatex: input.statementLatex }
                : {}),
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.privateNotes !== undefined
                ? { privateNotes: input.privateNotes }
                : {}),
        },
        select: ADMIN_PROBLEM_FIELDS,
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.PROBLEM_UPDATED,
        summary: `${actor.name} edited problem ${problem.position} ("${problem.title}") in "${existing.contest.title}".`,
        targetType: "Problem",
        targetId: problem.id,
        contestId,
        metadata: { fields: Object.keys(input) },
    });
    return problem;
}
export async function deleteProblem(actor: SessionUser, contestId: string, problemId: string) {
    const problem = await prisma.problem.findFirst({
        where: { id: problemId, contestId },
        select: {
            id: true,
            title: true,
            position: true,
            contest: { select: { title: true } },
            _count: { select: { votes: true } },
        },
    });
    if (!problem)
        throw new NotFoundError("Problem not found.");
    await prisma.$transaction(async (tx) => {
        await tx.problem.delete({ where: { id: problemId } });
        await tx.problem.updateMany({
            where: { contestId, position: { gt: problem.position } },
            data: { position: { decrement: 1 } },
        });
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.PROBLEM_DELETED,
        summary: `${actor.name} deleted problem ${problem.position} ("${problem.title}") from "${problem.contest.title}".`,
        targetType: "Problem",
        targetId: problem.id,
        contestId,
        metadata: { deletedVotes: problem._count.votes },
    });
    return { id: problem.id, title: problem.title };
}
export async function reorderProblems(actor: SessionUser, contestId: string, orderedIds: string[]) {
    const current = await prisma.problem.findMany({
        where: { contestId },
        select: { id: true },
    });
    const currentIds = new Set(current.map((problem) => problem.id));
    const incomingIds = new Set(orderedIds);
    if (orderedIds.length !== current.length ||
        incomingIds.size !== orderedIds.length ||
        orderedIds.some((id) => !currentIds.has(id))) {
        throw new ValidationError("The problem order is out of date. Reload the page and try again.");
    }
    await prisma.$transaction(async (tx) => {
        await Promise.all(orderedIds.map((id, index) => tx.problem.update({
            where: { id },
            data: { position: index + 1 + current.length },
        })));
        await Promise.all(orderedIds.map((id, index) => tx.problem.update({ where: { id }, data: { position: index + 1 } })));
    });
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { title: true },
    });
    await recordAudit({
        adminId: actor.id,
        action: AUDIT_ACTIONS.PROBLEMS_REORDERED,
        summary: `${actor.name} reordered the problems in "${contest?.title ?? "a contest"}".`,
        targetType: "Contest",
        targetId: contestId,
        contestId,
        metadata: { count: orderedIds.length },
    });
    return { count: orderedIds.length };
}
