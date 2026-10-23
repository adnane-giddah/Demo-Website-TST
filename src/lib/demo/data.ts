// Dummy data for the public "Demo as an administrator" area. Nothing here
// touches the database; every figure is invented.
export type DemoContest = {
    id: string;
    title: string;
    description: string;
    status: "DRAFT" | "OPEN" | "CLOSED";
    eventDate: string;
};
export type DemoProblem = {
    id: string;
    contestId: string;
    title: string;
    source: string;
    statement: string;
    beauty: number;
    difficulty: number;
    votes: number;
};
export type DemoUser = {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
    status: "PENDING" | "APPROVED" | "SUSPENDED";
};
export const DEMO_ADMIN = { name: "Morgan Demo", email: "morgan@example.test" };
export const DEMO_CONTESTS: DemoContest[] = [
    { id: "c1", title: "Team Selection Test 2026 - Round 1", description: "First selection round. Members rate each problem for beauty and difficulty.", status: "OPEN", eventDate: "2026-11-14" },
    { id: "c2", title: "Winter Camp Mock Olympiad", description: "Problem pool being drafted for the winter training camp.", status: "DRAFT", eventDate: "2027-01-20" },
    { id: "c3", title: "National Olympiad 2025", description: "Closed review of last year's shortlist.", status: "CLOSED", eventDate: "2025-04-05" },
];
export const DEMO_PROBLEMS: DemoProblem[] = [
    { id: "p1", contestId: "c1", title: "A composite quartic", source: "Original", statement: "Prove that $n^4+4$ is composite for every integer $n>1$.", beauty: 4.4, difficulty: 2.6, votes: 9 },
    { id: "p2", contestId: "c1", title: "Cyclic inequality", source: "Adapted", statement: "Let $a,b,c>0$ with $abc=1$. Show that $$\\frac{1}{a^3(b+c)}+\\frac{1}{b^3(c+a)}+\\frac{1}{c^3(a+b)}\\ge \\frac32.$$", beauty: 3.9, difficulty: 3.8, votes: 9 },
    { id: "p3", contestId: "c1", title: "Tangent circles", source: "Original", statement: "Two circles $\\omega_1,\\omega_2$ meet at $A$ and $B$. A line through $A$ meets them again at $P$ and $Q$. Prove that $\\angle PBQ$ does not depend on the line.", beauty: 4.7, difficulty: 4.2, votes: 8 },
    { id: "p4", contestId: "c1", title: "Pigeons on a grid", source: "Folklore", statement: "Each cell of a $5\\times5$ board is coloured with one of 3 colours. Prove that some rectangle has four corners of one colour.", beauty: 3.2, difficulty: 2.1, votes: 7 },
    { id: "p5", contestId: "c2", title: "Functional equation draft", source: "Draft", statement: "Find all $f:\\mathbb{R}\\to\\mathbb{R}$ with $f(x+f(y))=f(x)+y$ for all real $x,y$.", beauty: 0, difficulty: 0, votes: 0 },
    { id: "p6", contestId: "c3", title: "Divisibility chain", source: "Original", statement: "Find all primes $p$ such that $p^2+8$ is also prime.", beauty: 3.6, difficulty: 1.9, votes: 12 },
    { id: "p7", contestId: "c3", title: "Sum of sines", source: "Adapted", statement: "Evaluate $\\sum_{k=1}^{n}\\sin\\frac{k\\pi}{n+1}$ in closed form.", beauty: 4.0, difficulty: 3.1, votes: 12 },
];
export const DEMO_USERS: DemoUser[] = [
    { id: "u1", name: "Morgan Demo", email: "morgan@example.test", role: "SUPER_ADMIN", status: "APPROVED" },
    { id: "u2", name: "Jordan Lee", email: "jordan@example.test", role: "USER", status: "APPROVED" },
    { id: "u3", name: "Amira Benali", email: "amira@example.test", role: "ADMIN", status: "APPROVED" },
    { id: "u4", name: "Karim Haddad", email: "karim@example.test", role: "USER", status: "APPROVED" },
    { id: "u5", name: "Lina Mokrani", email: "lina@example.test", role: "USER", status: "PENDING" },
    { id: "u6", name: "Yacine Brahimi", email: "yacine@example.test", role: "USER", status: "PENDING" },
    { id: "u7", name: "Sara Khelil", email: "sara@example.test", role: "USER", status: "SUSPENDED" },
];
export const DEMO_ACTIVITY = [
    { when: "12 minutes ago", text: "Jordan Lee rated Tangent circles" },
    { when: "1 hour ago", text: "Amira Benali edited Cyclic inequality" },
    { when: "Yesterday", text: "Lina Mokrani requested an account" },
    { when: "2 days ago", text: "Morgan Demo opened voting on Round 1" },
];
