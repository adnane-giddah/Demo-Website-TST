import { config as loadDotenv } from "dotenv";
loadDotenv();
import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { IMO_SELECTION_PROBLEMS, NATIONAL_FINAL_PROBLEMS, WINTER_CAMP_PROBLEMS, type SeedProblem, } from "./seed-problems";
const prisma = new PrismaClient();
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
const DEMO_PASSWORD = "Olympiad2026!demo";
async function seedSuperAdmin() {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Platform Owner";
    if (!email || !password) {
        throw new Error("INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set. " +
            "Copy .env.example to .env and fill them in.");
    }
    if (password.length < 10) {
        throw new Error("INITIAL_ADMIN_PASSWORD must be at least 10 characters.");
    }
    const passwordHash = await hash(password, ARGON2_OPTIONS);
    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: { role: "SUPER_ADMIN", status: "APPROVED", name, passwordHash },
        create: {
            name,
            email,
            passwordHash,
            role: "SUPER_ADMIN",
            status: "APPROVED",
        },
    });
    console.log("  Super Admin ready: " + superAdmin.email);
    return superAdmin;
}
type DemoUserSpec = {
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    status: "PENDING" | "APPROVED" | "SUSPENDED" | "REMOVED";
};
const DEMO_USERS: DemoUserSpec[] = [
    { name: "Alex Morgan", email: "alex@example.test", role: "USER", status: "APPROVED" },
    { name: "Sam Rivera", email: "sam@example.test", role: "USER", status: "APPROVED" },
    { name: "Taylor Chen", email: "taylor@example.test", role: "USER", status: "APPROVED" },
    { name: "Jordan Blake", email: "jordan@example.test", role: "USER", status: "APPROVED" },
    { name: "Casey Nguyen", email: "casey@example.test", role: "USER", status: "APPROVED" },
    { name: "Morgan Lee", email: "morgan@example.test", role: "ADMIN", status: "APPROVED" },
    { name: "Riley Davis", email: "riley@example.test", role: "USER", status: "PENDING" },
    { name: "Drew Parker", email: "drew@example.test", role: "USER", status: "PENDING" },
    { name: "Jamie Foster", email: "jamie@example.test", role: "USER", status: "SUSPENDED" },
];
async function seedDemoUsers() {
    const passwordHash = await hash(DEMO_PASSWORD, ARGON2_OPTIONS);
    const users = await Promise.all(DEMO_USERS.map((spec) => prisma.user.upsert({
        where: { email: spec.email },
        update: { name: spec.name, role: spec.role, status: spec.status },
        create: { ...spec, passwordHash },
    })));
    console.log("  " + users.length + " demo accounts ready");
    return new Map(users.map((user) => [user.email, user]));
}
async function createContest(opts: {
    title: string;
    description: string;
    eventDate: Date | null;
    status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
    createdById: string;
    problems: SeedProblem[];
}) {
    const existing = await prisma.contest.findFirst({ where: { title: opts.title } });
    if (existing) {
        await prisma.contest.delete({ where: { id: existing.id } });
    }
    return prisma.contest.create({
        data: {
            title: opts.title,
            description: opts.description,
            eventDate: opts.eventDate,
            status: opts.status,
            createdById: opts.createdById,
            problems: {
                create: opts.problems.map((problem, index) => ({
                    title: problem.title,
                    statementLatex: problem.statementLatex,
                    source: problem.source,
                    privateNotes: problem.privateNotes,
                    position: index + 1,
                })),
            },
        },
        include: { problems: { orderBy: { position: "asc" } } },
    });
}
function makeRng(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}
async function main() {
    console.log("\nSeeding Olympiad Portal\n");
    const superAdmin = await seedSuperAdmin();
    if (process.env.SEED_DEMO_DATA !== "true") {
        console.log('\n  SEED_DEMO_DATA is not "true" - skipping demo content.\n');
        return;
    }
    const users = await seedDemoUsers();
    const get = (email: string) => {
        const user = users.get(email);
        if (!user)
            throw new Error("Demo user missing: " + email);
        return user;
    };
    const selection = await createContest({
        title: "IMO Selection 2026",
        description: "Problem selection session for the 2026 International Mathematical Olympiad team. Rate every problem on beauty and difficulty; ratings stay private to you while voting is open.",
        eventDate: new Date("2026-03-14T09:00:00Z"),
        status: "OPEN",
        createdById: superAdmin.id,
        problems: IMO_SELECTION_PROBLEMS,
    });
    const selectionPermissions: Array<[
        string,
        boolean,
        boolean,
        string
    ]> = [
        ["alex@example.test", true, true, "1.5"],
        ["sam@example.test", true, false, "1"],
        ["taylor@example.test", true, true, "0.5"],
        ["jordan@example.test", true, true, "2"],
        ["casey@example.test", true, true, "1"],
        ["morgan@example.test", true, true, "1.25"],
    ];
    await prisma.contestPermission.createMany({
        data: selectionPermissions.map(([email, canView, canVote, weight]) => ({
            userId: get(email).id,
            contestId: selection.id,
            canView,
            canVote,
            weight: new Prisma.Decimal(weight),
        })),
    });
    const rng = makeRng(20260314);
    const voters = selectionPermissions.filter(([, , canVote]) => canVote);
    const voteRows: Prisma.VoteCreateManyInput[] = [];
    for (const problem of selection.problems) {
        for (const [email] of voters) {
            if (rng() < 0.12)
                continue;
            voteRows.push({
                userId: get(email).id,
                problemId: problem.id,
                beauty: 5 + Math.floor(rng() * 6),
                difficulty: 4 + Math.floor(rng() * 7),
            });
        }
    }
    await prisma.vote.createMany({ data: voteRows, skipDuplicates: true });
    const national = await createContest({
        title: "National Olympiad 2025 - Final Round",
        description: "Problem set from the 2025 national final. Kept for reference; voting is closed.",
        eventDate: new Date("2025-05-18T08:00:00Z"),
        status: "CLOSED",
        createdById: superAdmin.id,
        problems: NATIONAL_FINAL_PROBLEMS,
    });
    const nationalPermissions: Array<[
        string,
        boolean,
        boolean,
        string
    ]> = [
        ["alex@example.test", true, true, "1"],
        ["taylor@example.test", true, true, "1"],
        ["morgan@example.test", true, true, "2"],
        ["casey@example.test", true, false, "1"],
    ];
    await prisma.contestPermission.createMany({
        data: nationalPermissions.map(([email, canView, canVote, weight]) => ({
            userId: get(email).id,
            contestId: national.id,
            canView,
            canVote,
            weight: new Prisma.Decimal(weight),
        })),
    });
    const rng2 = makeRng(20250518);
    const nationalVoteRows: Prisma.VoteCreateManyInput[] = [];
    for (const problem of national.problems) {
        for (const [email, , canVote] of nationalPermissions) {
            if (!canVote)
                continue;
            nationalVoteRows.push({
                userId: get(email).id,
                problemId: problem.id,
                beauty: 4 + Math.floor(rng2() * 7),
                difficulty: 3 + Math.floor(rng2() * 8),
            });
        }
    }
    await prisma.vote.createMany({ data: nationalVoteRows, skipDuplicates: true });
    await createContest({
        title: "Winter Training Camp 2026",
        description: "Draft problem set for the winter training camp. Not yet visible to the community.",
        eventDate: null,
        status: "DRAFT",
        createdById: superAdmin.id,
        problems: WINTER_CAMP_PROBLEMS,
    });
    const owner = superAdmin.name;
    await prisma.auditLog.deleteMany({});
    await prisma.auditLog.createMany({
        data: [
            {
                adminId: superAdmin.id,
                action: "contest.created",
                summary: owner + ' created the contest "IMO Selection 2026".',
                targetType: "Contest",
                targetId: selection.id,
                contestId: selection.id,
            },
            {
                adminId: superAdmin.id,
                action: "user.approved",
                summary: owner + " approved the account of Alex Morgan.",
                targetType: "User",
                targetId: get("alex@example.test").id,
            },
            {
                adminId: superAdmin.id,
                action: "permission.weight_changed",
                summary: owner +
                    ' changed the voting weight of Alex Morgan in "IMO Selection 2026" from 1 to 1.5.',
                targetType: "User",
                targetId: get("alex@example.test").id,
                contestId: selection.id,
                metadata: { from: "1", to: "1.5" },
            },
            {
                adminId: superAdmin.id,
                action: "permission.voting_enabled",
                summary: owner + ' enabled voting for Jordan Blake in "IMO Selection 2026".',
                targetType: "User",
                targetId: get("jordan@example.test").id,
                contestId: selection.id,
            },
            {
                adminId: superAdmin.id,
                action: "contest.status_changed",
                summary: owner + ' opened "IMO Selection 2026" for voting.',
                targetType: "Contest",
                targetId: selection.id,
                contestId: selection.id,
                metadata: { from: "DRAFT", to: "OPEN" },
            },
        ],
    });
    const problemCount = await prisma.problem.count();
    const voteCount = await prisma.vote.count();
    console.log("  3 contests, " + problemCount + " problems, " + voteCount + " votes\n");
    console.log("  Demo sign-in (development only)");
    console.log("    voter, weight 1.5       alex@example.test   " + DEMO_PASSWORD);
    console.log("    view only, cannot vote  sam@example.test     " + DEMO_PASSWORD);
    console.log("    administrator           morgan@example.test   " + DEMO_PASSWORD);
    console.log("    awaiting approval       riley@example.test   " + DEMO_PASSWORD);
    console.log("");
}
main()
    .catch((error) => {
    console.error("\nSeed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
