// In-memory dummy dataset behind "Demo as an administrator". Nothing here
// touches the database; every name, rating and event is invented.
import type { ContestStatus, Role, UserStatus } from "@prisma/client";
import { plainAverage, ratingDistribution, weightedAverage } from "@/lib/calculations/weighted";
import { NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/current-user";
import type { AuditEntry } from "@/lib/services/dashboard-service";
import type { ContestParticipant } from "@/lib/services/permission-service";
import type { ContestResults, IndividualVote, ProblemResult } from "@/lib/services/results-service";
import type { AdminContestSummary, MemberContestSummary } from "@/lib/services/contest-service";
import type { ManagedUser } from "@/lib/services/user-service";
const DAY = 86_400_000;
const NOW = Date.now();
const ago = (days: number, hours = 0) => new Date(NOW - days * DAY - hours * 3_600_000);
export const DEMO_USER: SessionUser = {
    id: "demo-morgan",
    name: "Morgan Rivera",
    email: "morgan@example.test",
    role: "SUPER_ADMIN",
    status: "APPROVED",
    createdAt: ago(200),
};
type U = SessionUser;
const mk = (id: string, name: string, role: Role, status: UserStatus, daysAgo: number): U => ({
    id, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.test`, role, status, createdAt: ago(daysAgo),
});
const USERS: U[] = [
    DEMO_USER,
    mk("u-amira", "Amira Benali", "ADMIN", "APPROVED", 180),
    mk("u-karim", "Karim Haddad", "ADMIN", "APPROVED", 150),
    mk("u-jordan", "Jordan Lee", "USER", "APPROVED", 120),
    mk("u-nadia", "Nadia Cherif", "USER", "APPROVED", 110),
    mk("u-omar", "Omar Zeroual", "USER", "APPROVED", 100),
    mk("u-ines", "Ines Bouzid", "USER", "APPROVED", 90),
    mk("u-rayan", "Rayan Hamidi", "USER", "APPROVED", 70),
    mk("u-sara", "Sara Khelil", "USER", "SUSPENDED", 60),
    mk("u-lina", "Lina Mokrani", "USER", "PENDING", 3),
    mk("u-yacine", "Yacine Brahimi", "USER", "PENDING", 2),
    mk("u-meriem", "Meriem Saadi", "USER", "PENDING", 1),
];
type C = {
    id: string; title: string; description: string; eventDate: Date | null; status: ContestStatus;
    createdAt: Date; updatedAt: Date; createdBy: string;
};
const CONTESTS: C[] = [
    { id: "c-r1", title: "Team Selection Test 2026, Round 1", description: "First selection round. Members rate each problem for beauty and difficulty before the committee meets.", eventDate: ago(-20), status: "OPEN", createdAt: ago(30), updatedAt: ago(1), createdBy: "Morgan Rivera" },
    { id: "c-r2", title: "Team Selection Test 2026, Round 2", description: "Second round, geared towards combinatorics and number theory.", eventDate: ago(-45), status: "OPEN", createdAt: ago(14), updatedAt: ago(2), createdBy: "Amira Benali" },
    { id: "c-camp", title: "Winter Camp Mock Olympiad", description: "Problem pool still being drafted for the winter training camp.", eventDate: ago(-80), status: "DRAFT", createdAt: ago(6), updatedAt: ago(3), createdBy: "Karim Haddad" },
    { id: "c-nat", title: "National Olympiad 2025 Shortlist", description: "Closed review of last year's shortlist, kept for reference.", eventDate: ago(200), status: "CLOSED", createdAt: ago(240), updatedAt: ago(190), createdBy: "Morgan Rivera" },
];
type P = {
    id: string; contestId: string; title: string; statementLatex: string; source: string | null;
    position: number; privateNotes: string | null; createdAt: Date; updatedAt: Date;
};
const P_DEFS: [string, string, string, string, string | null][] = [
    ["c-r1", "A composite quartic", "Prove that $n^4+4$ is composite for every integer $n>1$.", "Original", "Sophie Germain identity. Easy opener."],
    ["c-r1", "Cyclic inequality", "Let $a,b,c>0$ with $abc=1$. Show that $$\\frac{1}{a^3(b+c)}+\\frac{1}{b^3(c+a)}+\\frac{1}{c^3(a+b)}\\ge \\frac32.$$", "IMO 1995 (adapted)", "Substitute $x=1/a$ etc., then Cauchy-Schwarz."],
    ["c-r1", "Two circles", "Two circles $\\omega_1,\\omega_2$ meet at $A$ and $B$. A line through $A$ meets them again at $P$ and $Q$. Prove that $\\angle PBQ$ does not depend on the line.", "Original", null],
    ["c-r1", "Pigeons on a grid", "Each cell of a $5\\times 5$ board is coloured with one of $3$ colours. Prove that some rectangle has all four corners the same colour.", "Folklore", "Check the 4x6 case: it has a known counterexample for 3 colours."],
    ["c-r1", "A functional equation", "Find all $f:\\mathbb{R}\\to\\mathbb{R}$ such that $f(x+f(y))=f(x)+y$ for all real $x,y$.", "Original", null],
    ["c-r2", "Binomial divisibility", "Show that $\\binom{2n}{n}$ is divisible by $n+1$ for every positive integer $n$.", "Classical", null],
    ["c-r2", "Round-robin tournament", "In a round-robin tournament with $n$ players there are no draws. Prove that the players can be ordered so that each beat the next.", "Rédei", "Induction on n."],
    ["c-r2", "A tricky sum", "Evaluate $\\sum_{k=1}^{n}\\sin\\frac{k\\pi}{n+1}$ in closed form.", "Adapted", null],
    ["c-r2", "Prime squares", "Find all primes $p$ such that $p^2+8$ is also prime.", "Original", null],
    ["c-camp", "Polynomial roots", "Let $P(x)=x^3+ax^2+bx+c$ have three real roots. Prove $a^2\\ge 3b$.", "Draft", "Needs a harder variant."],
    ["c-camp", "Incircle lengths", "In triangle $ABC$ the incircle touches $BC$ at $D$. Show that $AB+CD=AC+BD$.", "Draft", null],
    ["c-camp", "Chessboard tiling", "Can an $8\\times 8$ board with two opposite corners removed be tiled by dominoes?", "Folklore", null],
    ["c-nat", "Divisibility chain", "Find all positive integers $n$ such that $n\\mid 2^n-1$.", "Original", null],
    ["c-nat", "Triangle inequality", "For a triangle with sides $a,b,c$ prove that $a^2+b^2+c^2<2(ab+bc+ca)$.", "Classical", null],
    ["c-nat", "Coloured points", "Each point of the plane is coloured red or blue. Prove that some unit-side equilateral triangle... or that two points at distance $1$ share a colour.", "Folklore", null],
    ["c-nat", "Sequence limit", "Let $a_1=1$ and $a_{n+1}=\\sqrt{2+a_n}$. Prove that $(a_n)$ converges and find its limit.", "Classical", null],
    ["c-nat", "Graph colouring", "Prove that every planar graph has a vertex of degree at most $5$.", "Classical", null],
];
const posCount: Record<string, number> = {};
const PROBLEMS: P[] = P_DEFS.map(([contestId, title, statementLatex, source, privateNotes], i) => {
    posCount[contestId] = (posCount[contestId] ?? 0) + 1;
    return { id: `p-${i + 1}`, contestId, title, statementLatex, source, position: posCount[contestId], privateNotes, createdAt: ago(20), updatedAt: ago(2) };
});
type Perm = { userId: string; contestId: string; canView: boolean; canVote: boolean; weight: number };
const WEIGHT: Record<string, number> = { "demo-morgan": 3, "u-amira": 2, "u-karim": 2, "u-jordan": 1, "u-nadia": 1.5, "u-omar": 1, "u-ines": 1, "u-rayan": 1, "u-sara": 1 };
const PERMS: Perm[] = [];
for (const c of CONTESTS) {
    for (const u of USERS) {
        if (u.status === "PENDING")
            continue;
        const everyone = c.id !== "c-camp" || u.role !== "USER";
        const voter = u.id !== "u-rayan" || c.id !== "c-r2";
        PERMS.push({ userId: u.id, contestId: c.id, canView: everyone, canVote: everyone && voter && u.status === "APPROVED", weight: WEIGHT[u.id] ?? 1 });
    }
}
type V = { userId: string; problemId: string; beauty: number | null; difficulty: number | null; updatedAt: Date };
const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++)
        h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0) / 4294967295;
};
const VOTES: V[] = [];
for (const p of PROBLEMS) {
    const contest = CONTESTS.find((c) => c.id === p.contestId)!;
    if (contest.status === "DRAFT")
        continue;
    const base = 3 + hash(p.id) * 5;
    const hard = 2 + hash(p.id + "d") * 6;
    for (const perm of PERMS.filter((x) => x.contestId === p.contestId && x.canVote)) {
        const skip = contest.id === "c-r2" ? 0.45 : contest.id === "c-r1" ? 0.18 : 0;
        const r = hash(perm.userId + p.id);
        if (r < skip)
            continue;
        const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
        VOTES.push({
            userId: perm.userId, problemId: p.id,
            beauty: clamp(base + (hash(perm.userId + p.id + "b") - 0.5) * 4),
            difficulty: clamp(hard + (hash(perm.userId + p.id + "x") - 0.5) * 4),
            updatedAt: ago(Math.floor(hash(perm.userId + p.id + "t") * 8), 3),
        });
    }
}
const userById = (id: string) => USERS.find((u) => u.id === id);
const AUDIT: AuditEntry[] = [
    ["user.approved", "Morgan Rivera approved the account of Nadia Cherif.", 1.1, null],
    ["permission.voting_enabled", "Morgan Rivera enabled voting for Ines Bouzid in Team Selection Test 2026, Round 1.", 1.5, "c-r1"],
    ["permission.weight_changed", "Amira Benali changed the voting weight of Nadia Cherif to 1.5 in Team Selection Test 2026, Round 1.", 2, "c-r1"],
    ["contest.status_changed", "Amira Benali opened voting on Team Selection Test 2026, Round 2.", 2.4, "c-r2"],
    ["problem.created", "Amira Benali added the problem Prime squares to Team Selection Test 2026, Round 2.", 3, "c-r2"],
    ["user.registered", "Meriem Saadi requested an account.", 1, null],
    ["user.registered", "Yacine Brahimi requested an account.", 2, null],
    ["user.registered", "Lina Mokrani requested an account.", 3, null],
    ["problem.updated", "Karim Haddad edited the problem Polynomial roots in Winter Camp Mock Olympiad.", 3.2, "c-camp"],
    ["contest.created", "Karim Haddad created the contest Winter Camp Mock Olympiad.", 6, "c-camp"],
    ["user.suspended", "Morgan Rivera suspended the account of Sara Khelil.", 8, null],
    ["admin.granted", "Morgan Rivera made Karim Haddad an administrator.", 40, null],
    ["problem.reordered", "Morgan Rivera reordered the problems of Team Selection Test 2026, Round 1.", 12, "c-r1"],
    ["contest.status_changed", "Morgan Rivera opened voting on Team Selection Test 2026, Round 1.", 20, "c-r1"],
    ["contest.created", "Morgan Rivera created the contest Team Selection Test 2026, Round 1.", 30, "c-r1"],
    ["contest.status_changed", "Morgan Rivera closed National Olympiad 2025 Shortlist.", 190, "c-nat"],
].map(([action, summary, days, contestId], i) => ({
    id: `a-${i}`, action: action as string, summary: summary as string,
    adminName: (summary as string).split(" ").slice(0, 2).join(" "),
    targetType: null, targetId: null, contestId: contestId as string | null, metadata: null,
    createdAt: ago(days as number),
}));
const userVotes = (userId: string, contestId: string) => VOTES.filter((v) => v.userId === userId && PROBLEMS.find((p) => p.id === v.problemId)?.contestId === contestId);
export function demoListContestsForMember(user: SessionUser): MemberContestSummary[] {
    const rank = (s: ContestStatus) => (s === "OPEN" ? 0 : s === "CLOSED" ? 1 : 2);
    return CONTESTS
        .filter((c) => c.status !== "DRAFT" && PERMS.some((p) => p.userId === user.id && p.contestId === c.id && p.canView))
        .sort((a, b) => rank(a.status) - rank(b.status))
        .map((c) => ({
        id: c.id, title: c.title, description: c.description, eventDate: c.eventDate, status: c.status,
        problemCount: PROBLEMS.filter((p) => p.contestId === c.id).length,
        ratedCount: userVotes(user.id, c.id).filter((v) => v.beauty !== null && v.difficulty !== null).length,
        canVote: PERMS.some((p) => p.userId === user.id && p.contestId === c.id && p.canVote),
    }));
}
export function demoListContestsForAdmin(filters: {
    search?: string;
    status?: ContestStatus | "ALL";
}): AdminContestSummary[] {
    const q = filters.search?.trim().toLowerCase();
    return CONTESTS
        .filter((c) => (!filters.status || filters.status === "ALL" || c.status === filters.status) && (!q || c.title.toLowerCase().includes(q)))
        .map((c) => {
        const perms = PERMS.filter((p) => p.contestId === c.id);
        return {
            id: c.id, title: c.title, description: c.description, eventDate: c.eventDate, status: c.status,
            createdAt: c.createdAt, updatedAt: c.updatedAt, createdByName: c.createdBy,
            problemCount: PROBLEMS.filter((p) => p.contestId === c.id).length,
            authorisedCount: perms.filter((p) => p.canView).length,
            voterCount: perms.filter((p) => p.canVote).length,
        };
    });
}
export function demoContest(contestId: string) {
    const c = CONTESTS.find((x) => x.id === contestId);
    if (!c)
        return null;
    return { ...c, createdBy: { id: "x", name: c.createdBy }, _count: { problems: PROBLEMS.filter((p) => p.contestId === c.id).length } };
}
export function demoContestForAdmin(contestId: string) {
    const c = demoContest(contestId);
    if (!c)
        throw new NotFoundError("Contest not found.");
    return c;
}
export function demoAccess(user: SessionUser, contestId: string) {
    const c = CONTESTS.find((x) => x.id === contestId);
    if (!c)
        return null;
    const perm = PERMS.find((p) => p.userId === user.id && p.contestId === contestId);
    return { contest: c, perm };
}
export function demoOverview() {
    return {
        activeContests: CONTESTS.filter((c) => c.status === "OPEN").length,
        draftContests: CONTESTS.filter((c) => c.status === "DRAFT").length,
        pendingUsers: USERS.filter((u) => u.status === "PENDING").length,
        totalProblems: PROBLEMS.length,
        activeVoters: new Set(PERMS.filter((p) => p.canVote && CONTESTS.find((c) => c.id === p.contestId)?.status === "OPEN").map((p) => p.userId)).size,
        totalMembers: USERS.filter((u) => u.status === "APPROVED").length,
    };
}
export function demoAudit(filters: {
    search?: string;
    category?: string;
    contestId?: string;
    take?: number;
    skip?: number;
}) {
    const q = filters.search?.trim().toLowerCase();
    const rows = AUDIT.filter((a) => (!filters.category || filters.category === "ALL" || a.action.startsWith(`${filters.category}.`)) && (!filters.contestId || a.contestId === filters.contestId) && (!q || a.summary.toLowerCase().includes(q)));
    const skip = filters.skip ?? 0;
    return { total: rows.length, entries: rows.slice(skip, skip + (filters.take ?? 50)) };
}
export function demoParticipants(contestId: string): ContestParticipant[] {
    return USERS
        .filter((u) => u.status === "APPROVED" || u.status === "SUSPENDED")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((u) => {
        const perm = PERMS.find((p) => p.userId === u.id && p.contestId === contestId);
        return {
            userId: u.id, name: u.name, email: u.email, role: u.role, status: u.status as ContestParticipant["status"],
            canView: perm?.canView ?? false, canVote: perm?.canVote ?? false, weight: String(perm?.weight ?? 1),
            votesCast: userVotes(u.id, contestId).length,
        };
    });
}
export const demoProblems = (contestId: string) => PROBLEMS.filter((p) => p.contestId === contestId).sort((a, b) => a.position - b.position);
export function demoProblem(contestId: string, problemId: string) {
    const p = PROBLEMS.find((x) => x.id === problemId && x.contestId === contestId);
    if (!p)
        throw new NotFoundError("Problem not found.");
    return p;
}
export function demoProblemRows(contestId: string) {
    return demoProblems(contestId).map((p) => ({
        id: p.id, position: p.position, title: p.title, source: p.source,
        hasPrivateNotes: !!p.privateNotes, voteCount: VOTES.filter((v) => v.problemId === p.id).length,
    }));
}
export function demoEligible(contestId: string) {
    const perms = PERMS.filter((p) => p.contestId === contestId && p.canView);
    return { perms, eligibleVoters: perms.filter((p) => p.canVote).length };
}
export function demoResults(contestId: string): ContestResults {
    const c = CONTESTS.find((x) => x.id === contestId);
    if (!c)
        throw new NotFoundError("Contest not found.");
    const { perms, eligibleVoters } = demoEligible(contestId);
    const weights = new Map(perms.map((p) => [p.userId, p.weight]));
    const problems = demoProblems(contestId);
    const participants = new Set<string>();
    let completed = 0;
    const results: ProblemResult[] = problems.map((p) => {
        const votes = VOTES.filter((v) => v.problemId === p.id && weights.has(v.userId));
        votes.forEach((v) => participants.add(v.userId));
        const ratedBy = votes.filter((v) => v.beauty !== null && v.difficulty !== null).length;
        completed += ratedBy;
        return {
            id: p.id, position: p.position, title: p.title,
            beauty: weightedAverage(votes.map((v) => ({ rating: v.beauty, weight: weights.get(v.userId)! }))),
            difficulty: weightedAverage(votes.map((v) => ({ rating: v.difficulty, weight: weights.get(v.userId)! }))),
            plainBeauty: plainAverage(votes.map((v) => v.beauty)),
            plainDifficulty: plainAverage(votes.map((v) => v.difficulty)),
            ratedBy,
            beautyDistribution: ratingDistribution(votes.map((v) => v.beauty)),
            difficultyDistribution: ratingDistribution(votes.map((v) => v.difficulty)),
        };
    });
    const total = eligibleVoters * problems.length;
    return {
        contest: { id: c.id, title: c.title, status: c.status }, problems: results, eligibleVoters,
        participatingVoters: participants.size, completionRate: total === 0 ? 0 : completed / total,
    };
}
export function demoBreakdown(contestId: string, problemId: string) {
    const p = demoProblem(contestId, problemId);
    const { perms } = demoEligible(contestId);
    const rows = VOTES.filter((v) => v.problemId === problemId);
    const votes: IndividualVote[] = perms
        .filter((perm) => perm.canVote || rows.some((v) => v.userId === perm.userId))
        .sort((a, b) => (userById(a.userId)?.name ?? "").localeCompare(userById(b.userId)?.name ?? ""))
        .map((perm) => {
        const v = rows.find((r) => r.userId === perm.userId);
        const u = userById(perm.userId)!;
        return {
            userId: u.id, name: u.name, email: u.email, beauty: v?.beauty ?? null, difficulty: v?.difficulty ?? null,
            weight: String(perm.weight), updatedAt: v?.updatedAt ?? null, missing: !v || v.beauty === null || v.difficulty === null,
        };
    });
    const s = votes.map((v) => ({ beauty: v.beauty, difficulty: v.difficulty, weight: v.weight }));
    return {
        problem: { id: p.id, position: p.position, title: p.title, statementLatex: p.statementLatex },
        votes,
        beauty: weightedAverage(s.map((x) => ({ rating: x.beauty, weight: x.weight }))),
        difficulty: weightedAverage(s.map((x) => ({ rating: x.difficulty, weight: x.weight }))),
    };
}
export function demoProgress(contestId: string) {
    const { eligibleVoters } = demoEligible(contestId);
    return {
        eligibleVoters,
        problems: demoProblems(contestId).map((p) => ({
            id: p.id, position: p.position, title: p.title,
            ratedBy: VOTES.filter((v) => v.problemId === p.id && v.beauty !== null && v.difficulty !== null).length,
        })),
    };
}
export function demoListUsers(filters: {
    search?: string;
    status?: UserStatus | "ALL";
    role?: Role | "ALL";
}): ManagedUser[] {
    const q = filters.search?.trim().toLowerCase();
    return USERS
        .filter((u) => (!filters.status || filters.status === "ALL" || u.status === filters.status) && (!filters.role || filters.role === "ALL" || u.role === filters.role) && (!q || u.name.toLowerCase().includes(q) || u.email.includes(q)))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt, contestCount: PERMS.filter((p) => p.userId === u.id).length }));
}
export function demoCountUsersByStatus() {
    const counts: Record<UserStatus, number> = { PENDING: 0, APPROVED: 0, SUSPENDED: 0, REMOVED: 0 };
    USERS.forEach((u) => (counts[u.status] += 1));
    return counts;
}
export function demoOwnVotes(userId: string, contestId: string) {
    return new Map(userVotes(userId, contestId).map((v) => [v.problemId, v]));
}
export const demoOwnVote = (userId: string, problemId: string) => VOTES.find((v) => v.userId === userId && v.problemId === problemId) ?? null;
export const demoPermissionFlags = (contestId: string) => PERMS.filter((p) => p.contestId === contestId).map((p) => ({ canView: p.canView, canVote: p.canVote }));
export const demoSuperAdmins = () => USERS.filter((u) => u.role === "SUPER_ADMIN");
export const demoCounts = () => [USERS.length, CONTESTS.length, PROBLEMS.length, VOTES.length, AUDIT.length] as const;
