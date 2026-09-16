export type SeedProblem = {
    title: string;
    statementLatex: string;
    source: string | null;
    privateNotes: string | null;
};
export const IMO_SELECTION_PROBLEMS: SeedProblem[] = [
    {
        title: "Number Theory",
        source: "Proposed by the National Committee",
        privateNotes: "Standard modular-arithmetic opener. Consider moving it to position 2 if the geometry turns out easier than expected.",
        statementLatex: [
            "Let \\(n\\) be a positive integer. Prove that",
            "\\[ n^2 + n + 1 \\]",
            "is never divisible by \\(n + 2\\).",
            "",
            "Determine, with proof, all integers \\(n\\) for which",
            "\\[ \\gcd\\left(n^2 + n + 1,\\; n + 2\\right) > 1. \\]",
        ].join("\n"),
    },
    {
        title: "Geometry",
        source: "Shortlist G4 style",
        privateNotes: "Needs the radical axis. A strong discriminator for the top ten candidates.",
        statementLatex: [
            "Let \\(ABC\\) be an acute triangle with circumcentre \\(O\\) and orthocentre \\(H\\). The line \\(AO\\) meets the circumcircle again at \\(D\\).",
            "",
            "Prove that",
            "\\[ \\overrightarrow{OH} = \\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC}, \\]",
            "and deduce that \\(BHCD\\) is a parallelogram.",
            "",
            "Show further that",
            "\\[ \\frac{[BHC]}{[ABC]} = \\frac{\\cos A}{\\cos B \\cos C}. \\]",
        ].join("\n"),
    },
    {
        title: "Combinatorics",
        source: null,
        privateNotes: "Double counting. Beautiful, but perhaps too well known.",
        statementLatex: [
            "A committee of \\(2n\\) mathematicians sits around a round table. Each pair either collaborates or does not. It is known that among any three of them, at least two collaborate.",
            "",
            "Prove that one can select \\(n\\) of them, say \\(m_1, m_2, \\ldots, m_n\\), such that",
            "\\[ \\sum_{i=1}^{n} d(m_i) \\geq n(n-1), \\]",
            "where \\(d(m)\\) denotes the number of collaborators of \\(m\\).",
        ].join("\n"),
    },
    {
        title: "Algebra",
        source: "Adapted from a classical inequality",
        privateNotes: null,
        statementLatex: [
            "Let \\(a, b, c\\) be positive real numbers with \\(abc = 1\\). Prove that",
            "\\[ \\frac{1}{a^3(b+c)} + \\frac{1}{b^3(c+a)} + \\frac{1}{c^3(a+b)} \\geq \\frac{3}{2}. \\]",
            "",
            "Determine all cases of equality.",
        ].join("\n"),
    },
    {
        title: "Functional Equation",
        source: null,
        privateNotes: "Injectivity first, then the substitution \\(y \\mapsto -f(x)\\).",
        statementLatex: [
            "Find all functions \\(f \\colon \\mathbb{R} \\to \\mathbb{R}\\) such that",
            "\\[ f\\bigl(x^2 + f(y)\\bigr) = y + \\bigl(f(x)\\bigr)^2 \\]",
            "for all \\(x, y \\in \\mathbb{R}\\).",
        ].join("\n"),
    },
    {
        title: "Matrices and Systems",
        source: "Team selection, internal proposal",
        privateNotes: "Sits between olympiad and undergraduate level. Check that it is appropriate for the age group.",
        statementLatex: [
            "Let \\(A\\) be the \\(n \\times n\\) matrix",
            "\\[",
            "A = \\begin{pmatrix}",
            "2 & -1 & 0 & \\cdots & 0 \\\\",
            "-1 & 2 & -1 & \\cdots & 0 \\\\",
            "0 & -1 & 2 & \\cdots & 0 \\\\",
            "\\vdots & \\vdots & \\vdots & \\ddots & \\vdots \\\\",
            "0 & 0 & 0 & \\cdots & 2",
            "\\end{pmatrix}.",
            "\\]",
            "",
            "Prove that \\(\\det A = n + 1\\), and that the system",
            "\\[",
            "\\begin{cases}",
            "2x_1 - x_2 = 1, \\\\",
            "-x_{k-1} + 2x_k - x_{k+1} = 1 & (2 \\leq k \\leq n-1), \\\\",
            "-x_{n-1} + 2x_n = 1",
            "\\end{cases}",
            "\\]",
            "has the unique solution \\(x_k = \\dfrac{k(n+1-k)}{2}\\).",
        ].join("\n"),
    },
    {
        title: "Sequences and Limits",
        source: null,
        privateNotes: null,
        statementLatex: [
            "Let \\((a_n)_{n \\geq 1}\\) be defined by \\(a_1 = 1\\) and",
            "\\[ a_{n+1} = a_n + \\frac{1}{a_n} \\qquad (n \\geq 1). \\]",
            "",
            "Prove that",
            "\\[ \\lim_{n \\to \\infty} \\frac{a_n}{\\sqrt{2n}} = 1, \\]",
            "and that \\(a_{100} < 15\\).",
        ].join("\n"),
    },
    {
        title: "Combinatorial Geometry",
        source: "Proposed for the final round",
        privateNotes: "Pigeonhole plus a clever colouring. Expect a low solve rate.",
        statementLatex: [
            "Consider \\(n \\geq 3\\) points in the plane, no three collinear. Each segment joining two of the points is coloured red or blue.",
            "",
            "Prove that if",
            "\\[ n \\geq \\binom{6}{3} = 20, \\]",
            "then there exist three points forming a monochromatic triangle whose area is at most",
            "\\[ \\frac{1}{n-2} \\max_{P,Q,R} [PQR]. \\]",
        ].join("\n"),
    },
];
export const NATIONAL_FINAL_PROBLEMS: SeedProblem[] = [
    {
        title: "Divisibility",
        source: "National Final 2025",
        privateNotes: null,
        statementLatex: [
            "Determine all pairs \\((m, n)\\) of positive integers such that",
            "\\[ m^2 + n^2 \\mid m^3 + n. \\]",
        ].join("\n"),
    },
    {
        title: "Cyclic Quadrilateral",
        source: "National Final 2025",
        privateNotes: null,
        statementLatex: [
            "Let \\(ABCD\\) be a cyclic quadrilateral whose diagonals meet at \\(P\\). Prove that",
            "\\[ \\frac{AP}{PC} = \\frac{AB \\cdot AD}{CB \\cdot CD}. \\]",
        ].join("\n"),
    },
    {
        title: "Counting Argument",
        source: "National Final 2025",
        privateNotes: null,
        statementLatex: [
            "In how many ways can the numbers \\(1, 2, \\ldots, 2n\\) be split into \\(n\\) pairs",
            "\\[ \\{a_1, b_1\\}, \\ldots, \\{a_n, b_n\\} \\]",
            "so that \\(|a_i - b_i| = 1\\) for every \\(i\\)? Prove your answer.",
        ].join("\n"),
    },
    {
        title: "Polynomial Roots",
        source: "National Final 2025",
        privateNotes: null,
        statementLatex: [
            "Let \\(P(x) = x^n + a_{n-1}x^{n-1} + \\cdots + a_1 x + a_0\\) have \\(n\\) real roots \\(r_1, \\ldots, r_n\\). Prove that",
            "\\[ \\sum_{i=1}^{n} r_i^2 = a_{n-1}^2 - 2a_{n-2}, \\]",
            "and deduce that \\(a_{n-1}^2 \\geq 2a_{n-2}\\).",
        ].join("\n"),
    },
];
export const WINTER_CAMP_PROBLEMS: SeedProblem[] = [
    {
        title: "Inequality Warm-up",
        source: null,
        privateNotes: "Draft session, not yet reviewed.",
        statementLatex: [
            "For positive reals \\(x, y, z\\) prove that",
            "\\[ \\frac{x}{y+z} + \\frac{y}{z+x} + \\frac{z}{x+y} \\geq \\frac{3}{2}. \\]",
        ].join("\n"),
    },
    {
        title: "Greek Letters and Products",
        source: null,
        privateNotes: "Used to sanity-check the LaTeX renderer.",
        statementLatex: [
            "Let \\(\\alpha, \\beta, \\gamma\\) be the angles of a triangle and let \\(\\Gamma\\) be its circumcircle. Prove that",
            "\\[ \\sin^2\\alpha + \\sin^2\\beta + \\sin^2\\gamma = 2 + 2\\cos\\alpha\\cos\\beta\\cos\\gamma, \\]",
            "and that",
            "\\[ \\prod_{k=1}^{\\infty}\\left(1 - \\frac{\\theta^2}{k^2\\pi^2}\\right) = \\frac{\\sin\\theta}{\\theta}. \\]",
        ].join("\n"),
    },
];
