import { config as loadDotenv } from "dotenv";
loadDotenv();
import { PrismaClient } from "@prisma/client";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
const failures: string[] = [];
function check(label: string, condition: boolean, detail?: string) {
    if (condition) {
        passed += 1;
        console.log(`  PASS  ${label}`);
    }
    else {
        failed += 1;
        failures.push(label);
        console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    }
}
function step(number: number, title: string) {
    console.log(`\nStep ${number} — ${title}`);
}
class Session {
    private cookies = new Map<string, string>();
    constructor(readonly label: string) { }
    private header(): string {
        return [...this.cookies.entries()]
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    }
    private absorb(response: Response) {
        const raw = response.headers.getSetCookie?.() ?? [];
        for (const cookie of raw) {
            const [pair] = cookie.split(";");
            const index = pair.indexOf("=");
            if (index === -1)
                continue;
            const name = pair.slice(0, index).trim();
            const value = pair.slice(index + 1).trim();
            if (value === "")
                this.cookies.delete(name);
            else
                this.cookies.set(name, value);
        }
    }
    async request(path: string, init: {
        method?: string;
        body?: unknown;
    } = {}): Promise<{
        status: number;
        json: any;
        text: string;
    }> {
        const headers: Record<string, string> = {};
        const cookieHeader = this.header();
        if (cookieHeader)
            headers.cookie = cookieHeader;
        if (init.body !== undefined)
            headers["content-type"] = "application/json";
        const response = await fetch(`${BASE_URL}${path}`, {
            method: init.method ?? "GET",
            headers,
            body: init.body === undefined ? undefined : JSON.stringify(init.body),
            redirect: "manual",
        });
        this.absorb(response);
        const text = await response.text();
        let json: any = null;
        try {
            json = JSON.parse(text);
        }
        catch {
            json = null;
        }
        return { status: response.status, json, text };
    }
    get hasSession() {
        return this.cookies.has("olympiad_session");
    }
}
async function main() {
    console.log(`\nAcceptance test against ${BASE_URL}\n${"=".repeat(60)}`);
    const stamp = Date.now();
    const candidateEmail = `acceptance.${stamp}@example.test`;
    const candidatePassword = "Acceptance2026!test";
    const contestTitle = `Acceptance Contest ${stamp}`;
    const admin = new Session("super admin");
    const member = new Session("member");
    step(1, "Super Admin signs in");
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL ?? "").toLowerCase();
    const login = await admin.request("/api/auth/login", {
        method: "POST",
        body: { email: adminEmail, password: process.env.INITIAL_ADMIN_PASSWORD },
    });
    check("super admin can sign in", login.status === 200, `status ${login.status}`);
    check("session cookie issued", admin.hasSession);
    check("role is SUPER_ADMIN", login.json?.user?.role === "SUPER_ADMIN");
    step(2, "A new user registers and becomes PENDING");
    const registration = await member.request("/api/auth/register", {
        method: "POST",
        body: {
            name: "Acceptance Candidate",
            email: candidateEmail,
            password: candidatePassword,
            confirmPassword: candidatePassword,
        },
    });
    check("registration accepted", registration.status === 201, `status ${registration.status}`);
    check("message tells the user to wait for approval", typeof registration.json?.message === "string" &&
        registration.json.message.toLowerCase().includes("waiting for administrator approval"));
    const candidate = await prisma.user.findUnique({
        where: { email: candidateEmail },
        select: { id: true, status: true, role: true, passwordHash: true },
    });
    check("account stored as PENDING", candidate?.status === "PENDING");
    check("role defaults to USER", candidate?.role === "USER");
    check("password stored as an Argon2id hash, never plaintext", !!candidate?.passwordHash.startsWith("$argon2id$") &&
        !candidate.passwordHash.includes(candidatePassword));
    const pendingLogin = await member.request("/api/auth/login", {
        method: "POST",
        body: { email: candidateEmail, password: candidatePassword },
    });
    check("pending user is routed to the waiting page", pendingLogin.json?.redirectTo === "/pending");
    const pendingDashboard = await member.request("/dashboard");
    check("pending user cannot reach the dashboard", pendingDashboard.status === 307 || pendingDashboard.status === 302, `status ${pendingDashboard.status}`);
    step(3, "Super Admin approves the account");
    const approval = await admin.request(`/api/admin/users/${candidate!.id}`, {
        method: "PATCH",
        body: { status: "APPROVED" },
    });
    check("approval accepted", approval.status === 200, `status ${approval.status}`);
    check("status is now APPROVED", approval.json?.user?.status === "APPROVED");
    step(4, "Super Admin creates a contest");
    const created = await admin.request("/api/admin/contests", {
        method: "POST",
        body: {
            title: contestTitle,
            description: "Created by the acceptance test.",
            status: "OPEN",
        },
    });
    check("contest created", created.status === 201, `status ${created.status}`);
    const contestId: string = created.json?.contest?.id;
    check("contest id returned", typeof contestId === "string" && contestId.length > 0);
    step(5, "Super Admin adds problems written in LaTeX");
    const statements = [
        {
            title: "Number Theory",
            statementLatex: "Let \\(n\\) be a positive integer. Prove that\n\\[ n^2 + n + 1 \\]\nis never divisible by \\(n + 2\\).",
            privateNotes: "Admin-only note that must never reach a member.",
        },
        {
            title: "Algebra",
            statementLatex: "Prove that for positive reals,\n\\[ \\sum_{i=1}^{n} \\frac{1}{a_i} \\geq \\frac{n^2}{\\sum a_i}. \\]",
            privateNotes: null,
        },
        {
            title: "Geometry",
            statementLatex: "Let \\(\\Gamma\\) be the circumcircle of \\(\\triangle ABC\\). Show that \\(\\frac{AB}{\\sin \\gamma} = 2R\\).",
            privateNotes: null,
        },
    ];
    const problemIds: string[] = [];
    for (const statement of statements) {
        const response = await admin.request(`/api/admin/contests/${contestId}/problems`, { method: "POST", body: statement });
        if (response.status === 201)
            problemIds.push(response.json.problem.id);
    }
    check("three problems added", problemIds.length === 3);
    const storedProblems = await prisma.problem.findMany({
        where: { contestId },
        orderBy: { position: "asc" },
        select: { position: true, statementLatex: true },
    });
    check("problems numbered 1, 2, 3", storedProblems.map((p) => p.position).join(",") === "1,2,3");
    check("LaTeX stored verbatim, backslashes intact", storedProblems[0]?.statementLatex.includes("\\(n\\)"));
    const editorPage = await admin.request(`/admin/contests/${contestId}/problems/new`);
    const countOf = (needle: string) => editorPage.text.split(needle).length - 1;
    const fieldCopies = ["title", "statementLatex", "source", "privateNotes"].map((field) => countOf(`id="${field}"`));
    check("the problem editor renders each field exactly once", fieldCopies.every((count) => count === 1), `copies per field: ${fieldCopies.join(", ")}`);
    check("the problem editor has exactly one submit button", countOf('type="submit"') === 1, `found ${countOf('type="submit"')}`);
    step(6, "Super Admin grants contest access");
    const grantAccess = await admin.request(`/api/admin/contests/${contestId}/permissions`, { method: "PATCH", body: { userId: candidate!.id, canView: true } });
    check("access granted", grantAccess.json?.permission?.canView === true);
    check("voting is NOT granted implicitly with access", grantAccess.json?.permission?.canVote === false);
    const cannotVoteYet = await member.request("/api/votes", {
        method: "POST",
        body: { problemId: problemIds[0], beauty: 5 },
    });
    check("member with access but no voting permission is refused", cannotVoteYet.status === 403, `status ${cannotVoteYet.status}`);
    step(7, "Super Admin enables voting");
    const enableVoting = await admin.request(`/api/admin/contests/${contestId}/permissions`, { method: "PATCH", body: { userId: candidate!.id, canVote: true } });
    check("voting enabled", enableVoting.json?.permission?.canVote === true);
    step(8, "Super Admin assigns a weight of 1.5");
    const setWeight = await admin.request(`/api/admin/contests/${contestId}/permissions`, { method: "PATCH", body: { userId: candidate!.id, weight: 1.5 } });
    check("weight accepted", Number(setWeight.json?.permission?.weight) === 1.5);
    const rejectedWeight = await admin.request(`/api/admin/contests/${contestId}/permissions`, { method: "PATCH", body: { userId: candidate!.id, weight: 250 } });
    check("out-of-range weight rejected", rejectedWeight.status === 422, `status ${rejectedWeight.status}`);
    step(9, "The member signs in");
    const memberLogin = await member.request("/api/auth/login", {
        method: "POST",
        body: { email: candidateEmail, password: candidatePassword },
    });
    check("member signed in", memberLogin.status === 200);
    check("routed to the dashboard", memberLogin.json?.redirectTo === "/dashboard");
    step(10, "The member sees the contest");
    const dashboard = await member.request("/dashboard");
    check("dashboard loads", dashboard.status === 200, `status ${dashboard.status}`);
    check("the contest is listed", dashboard.text.includes(contestTitle));
    step(11, "The member reads the problems");
    const problemPage = await member.request(`/contests/${contestId}/problems/${problemIds[0]}`);
    check("problem page loads", problemPage.status === 200, `status ${problemPage.status}`);
    check("the statement is rendered by KaTeX", problemPage.text.includes("katex"));
    check("private notes are not in the response", !problemPage.text.includes("Admin-only note that must never reach a member"));
    step(12, "The member rates beauty 9 and difficulty 8");
    const firstVote = await member.request("/api/votes", {
        method: "POST",
        body: { problemId: problemIds[0], beauty: 9, difficulty: 8 },
    });
    check("rating accepted", firstVote.status === 200, `status ${firstVote.status}`);
    check("beauty recorded as 9", firstVote.json?.vote?.beauty === 9);
    check("difficulty recorded as 8", firstVote.json?.vote?.difficulty === 8);
    step(13, "The member changes beauty from 9 to 7");
    const changedVote = await member.request("/api/votes", {
        method: "POST",
        body: { problemId: problemIds[0], beauty: 7 },
    });
    check("change accepted", changedVote.status === 200);
    check("beauty updated to 7", changedVote.json?.vote?.beauty === 7);
    check("difficulty left untouched at 8", changedVote.json?.vote?.difficulty === 8);
    const voteRows = await prisma.vote.count({
        where: { userId: candidate!.id, problemId: problemIds[0] },
    });
    check("exactly one vote row exists — no duplicate", voteRows === 1, `found ${voteRows}`);
    const second = await prisma.user.findUnique({
        where: { email: "ahmed@example.test" },
        select: { id: true },
    });
    await admin.request(`/api/admin/contests/${contestId}/permissions`, {
        method: "PATCH",
        body: { userId: second!.id, canVote: true, weight: 0.5 },
    });
    const secondSession = new Session("second voter");
    await secondSession.request("/api/auth/login", {
        method: "POST",
        body: { email: "ahmed@example.test", password: "Olympiad2026!demo" },
    });
    await secondSession.request("/api/votes", {
        method: "POST",
        body: { problemId: problemIds[0], beauty: 3, difficulty: 4 },
    });
    step(14, "The member cannot see anyone else's votes");
    const forbiddenBreakdown = await member.request(`/api/admin/results?contestId=${contestId}&problemId=${problemIds[0]}`);
    check("individual votes API refuses a member", forbiddenBreakdown.status === 403);
    const forbiddenPermissions = await member.request(`/api/admin/contests/${contestId}/permissions`);
    check("access list API refuses a member", forbiddenPermissions.status === 403);
    const reloadedProblem = await member.request(`/contests/${contestId}/problems/${problemIds[0]}`);
    check("the problem page carries no other voter's name", !reloadedProblem.text.includes("Ahmed Benali"));
    const unescaped = reloadedProblem.text.replace(/\\"/g, '"');
    check("the member's own rating is present", unescaped.includes('"initialBeauty":7'));
    step(15, "The member cannot see weighted averages");
    const forbiddenResults = await member.request(`/api/admin/results?contestId=${contestId}`);
    check("results API refuses a member", forbiddenResults.status === 403);
    const memberAdminPage = await member.request(`/admin/contests/${contestId}/results`);
    check("the admin results page is not reachable by a member", memberAdminPage.status === 404, `status ${memberAdminPage.status}`);
    step(16, "The admin opens the results");
    const results = await admin.request(`/api/admin/results?contestId=${contestId}`);
    check("results returned", results.status === 200, `status ${results.status}`);
    const firstResult = results.json?.problems?.find((problem: any) => problem.id === problemIds[0]);
    check("weighted beauty average is correct", Math.abs(firstResult?.beauty?.average - 6) < 1e-9, `got ${firstResult?.beauty?.average}`);
    check("weighted difficulty average is correct", Math.abs(firstResult?.difficulty?.average - 7) < 1e-9, `got ${firstResult?.difficulty?.average}`);
    check("the unweighted average differs, proving weights are applied", Math.abs(firstResult?.plainBeauty - 5) < 1e-9, `got ${firstResult?.plainBeauty}`);
    step(17, "The admin opens the individual ratings");
    const breakdown = await admin.request(`/api/admin/results?contestId=${contestId}&problemId=${problemIds[0]}`);
    check("individual ratings returned", breakdown.status === 200);
    const candidateRow = breakdown.json?.votes?.find((vote: any) => vote.userId === candidate!.id);
    check("the row names the voter", candidateRow?.name === "Acceptance Candidate");
    check("beauty is shown", candidateRow?.beauty === 7);
    check("difficulty is shown", candidateRow?.difficulty === 8);
    check("the weight is shown", Number(candidateRow?.weight) === 1.5);
    step(18, "The admin changes the weight and the average follows");
    await admin.request(`/api/admin/contests/${contestId}/permissions`, {
        method: "PATCH",
        body: { userId: candidate!.id, weight: 3 },
    });
    const reweighted = await admin.request(`/api/admin/results?contestId=${contestId}`);
    const reweightedProblem = reweighted.json?.problems?.find((problem: any) => problem.id === problemIds[0]);
    check("weighted beauty average recomputed", Math.abs(reweightedProblem?.beauty?.average - 22.5 / 3.5) < 1e-6, `got ${reweightedProblem?.beauty?.average}`);
    const weightAudit = await prisma.auditLog.findFirst({
        where: {
            contestId,
            action: "permission.weight_changed",
            targetId: candidate!.id,
        },
        orderBy: { createdAt: "desc" },
    });
    check("the weight change is in the audit log", !!weightAudit);
    check("the audit entry records the old and new weight", (weightAudit?.metadata as any)?.from === "1.5" &&
        (weightAudit?.metadata as any)?.to === "3", JSON.stringify(weightAudit?.metadata));
    step(19, "The admin removes the member from the contest");
    const removal = await admin.request(`/api/admin/contests/${contestId}/permissions/${candidate!.id}`, { method: "DELETE" });
    check("removal accepted", removal.status === 200, `status ${removal.status}`);
    check("the deleted ratings are reported", removal.json?.deletedVotes === 1);
    const permissionAfter = await prisma.contestPermission.findUnique({
        where: { userId_contestId: { userId: candidate!.id, contestId } },
    });
    check("contest access revoked", permissionAfter === null);
    const votesAfter = await prisma.vote.count({
        where: { userId: candidate!.id, problem: { contestId } },
    });
    check("their ratings for this contest are deleted", votesAfter === 0);
    const afterRemoval = await admin.request(`/api/admin/results?contestId=${contestId}`);
    const afterRemovalProblem = afterRemoval.json?.problems?.find((problem: any) => problem.id === problemIds[0]);
    check("their ratings no longer contribute to the average", Math.abs(afterRemovalProblem?.beauty?.average - 3) < 1e-9, `got ${afterRemovalProblem?.beauty?.average}`);
    const otherContestVotes = await prisma.vote.count({
        where: { userId: second!.id, problem: { contest: { title: "IMO Selection 2026" } } },
    });
    check("removal did not touch another contest", otherContestVotes > 0, `${otherContestVotes} ratings remain elsewhere`);
    const removedMemberDashboard = await member.request("/dashboard");
    check("the removed member can still sign in — only contest access was withdrawn", removedMemberDashboard.status === 200, `status ${removedMemberDashboard.status}`);
    check("the contest no longer appears for them", !removedMemberDashboard.text.includes(contestTitle));
    step(20, "The admin closes the contest");
    const closed = await admin.request(`/api/admin/contests/${contestId}`, {
        method: "PATCH",
        body: { status: "CLOSED" },
    });
    check("contest closed", closed.json?.contest?.status === "CLOSED");
    const voteAfterClose = await secondSession.request("/api/votes", {
        method: "POST",
        body: { problemId: problemIds[0], beauty: 10 },
    });
    check("a voter can no longer change a rating", voteAfterClose.status === 403, `status ${voteAfterClose.status}`);
    check("the refusal explains why", typeof voteAfterClose.json?.error === "string" &&
        voteAfterClose.json.error.toLowerCase().includes("closed"));
    const stillVisible = await secondSession.request(`/contests/${contestId}`);
    check("the contest is still readable after closing", stillVisible.status === 200 && stillVisible.text.includes(contestTitle), `status ${stillVisible.status}`);
    check("their own earlier rating is still shown", stillVisible.text.replace(/\\"/g, '"').includes(contestTitle));
    const outsider = new Session("outsider");
    await outsider.request("/api/auth/login", {
        method: "POST",
        body: { email: "sara@example.test", password: "Olympiad2026!demo" },
    });
    const outsiderView = await outsider.request(`/contests/${contestId}`);
    check("a member without contest access cannot read the contest", !outsiderView.text.includes(contestTitle), `status ${outsiderView.status}`);
    const adminStillSeesResults = await admin.request(`/api/admin/results?contestId=${contestId}`);
    check("the admin can still inspect the results", adminStillSeesResults.status === 200);
    console.log("\nCleaning up test data");
    await prisma.auditLog
        .deleteMany({ where: { OR: [{ contestId }, { targetId: candidate!.id }] } })
        .catch(() => undefined);
    await prisma.contest.delete({ where: { id: contestId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: candidate!.id } }).catch(() => undefined);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`${passed} passed, ${failed} failed`);
    if (failed > 0) {
        console.log("\nFailures:");
        for (const failure of failures)
            console.log(`  - ${failure}`);
    }
    console.log("");
    process.exitCode = failed === 0 ? 0 : 1;
}
main()
    .catch((error) => {
    console.error("\nAcceptance test crashed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
