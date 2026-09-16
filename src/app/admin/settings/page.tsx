import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { RoleBadge } from "@/components/shared/status-badge";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CAPABILITIES, hasCapability, type Capability, } from "@/lib/permissions/capabilities";
import { RATING_MAX, RATING_MIN, WEIGHT_MAX, WEIGHT_MIN } from "@/lib/validation/schemas";
import { cn, formatDateTime } from "@/lib/utils";
export const metadata: Metadata = { title: "Settings" };
const CAPABILITY_GROUPS: Array<{
    label: string;
    prefix: string;
}> = [
    { label: "Accounts", prefix: "user:" },
    { label: "Administrators", prefix: "admin:" },
    { label: "Contests", prefix: "contest:" },
    { label: "Problems", prefix: "problem:" },
    { label: "Permissions and weights", prefix: "permission:" },
    { label: "Weights", prefix: "weight:" },
    { label: "Results", prefix: "results:" },
    { label: "Votes", prefix: "votes:" },
    { label: "Audit", prefix: "audit:" },
];
export default async function AdminSettingsPage() {
    const actor = await requireAdmin();
    const [superAdmins, counts] = await Promise.all([
        prisma.user.findMany({
            where: { role: "SUPER_ADMIN" },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, email: true, status: true, createdAt: true },
        }),
        prisma.$transaction([
            prisma.user.count(),
            prisma.contest.count(),
            prisma.problem.count(),
            prisma.vote.count(),
            prisma.auditLog.count(),
        ]),
    ]);
    const [userCount, contestCount, problemCount, voteCount, auditCount] = counts;
    return (<div className="space-y-8">
 <PageHeader title="Settings" description="How the platform's set up, and what you personally are allowed to do here."/>

 <section aria-labelledby="rules-heading" className="space-y-3">
 <h2 id="rules-heading" className="text-sm font-semibold tracking-tight">
 Platform rules
 </h2>
 <dl className="grid gap-x-8 gap-y-3 rounded-lg border bg-card p-5 text-sm sm:grid-cols-2">
 <div>
 <dt className="text-muted-foreground">Rating scale</dt>
 <dd className="tabular mt-0.5 font-medium">
 {RATING_MIN} to {RATING_MAX}, on beauty and difficulty independently
 </dd>
 </div>
 <div>
 <dt className="text-muted-foreground">Voting weight range</dt>
 <dd className="tabular mt-0.5 font-medium">
 {WEIGHT_MIN} to {WEIGHT_MAX}, per member per contest
 </dd>
 </div>
 <div>
 <dt className="text-muted-foreground">Votes per member per problem</dt>
 <dd className="mt-0.5 font-medium">
 One, enforced by a database constraint
 </dd>
 </div>
 <div>
 <dt className="text-muted-foreground">Weighted average</dt>
 <dd className="mt-0.5 font-medium">
 Σ(rating × weight) ÷ Σ(weight), computed on the server
 </dd>
 </div>
 <div>
 <dt className="text-muted-foreground">Member visibility</dt>
 <dd className="mt-0.5 font-medium">
 Own ratings only — never other votes, weights or averages
 </dd>
 </div>
 <div>
 <dt className="text-muted-foreground">New accounts</dt>
 <dd className="mt-0.5 font-medium">
 Created as pending; an administrator must approve them
 </dd>
 </div>
 </dl>
 </section>

 <section aria-labelledby="capabilities-heading" className="space-y-3">
 <div>
 <h2 id="capabilities-heading" className="text-sm font-semibold tracking-tight">
 Your permissions
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Signed in as {actor.name} <RoleBadge role={actor.role} className="ml-1 align-middle"/>
 </p>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {CAPABILITY_GROUPS.map((group) => {
            const items = CAPABILITIES.filter((capability) => capability.startsWith(group.prefix));
            if (items.length === 0)
                return null;
            return (<div key={group.prefix} className="rounded-lg border bg-card p-4">
 <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
 {group.label}
 </h3>
 <ul className="mt-2.5 space-y-1.5">
 {items.map((capability) => {
                    const allowed = hasCapability(actor.role, capability as Capability);
                    return (<li key={capability} className={cn("flex items-center gap-2 font-mono text-xs", allowed ? "text-foreground" : "text-muted-foreground/60")}>
 <span aria-hidden className="w-3 shrink-0 text-center">
 {allowed ? "+" : "–"}
 </span>
 <span className="truncate">
 {capability.split(":")[1]?.replace(/_/g, " ")}
 </span>
 </li>);
                })}
 </ul>
 </div>);
        })}
 </div>
 </section>

 <section aria-labelledby="super-admins-heading" className="space-y-3">
 <div>
 <h2 id="super-admins-heading" className="text-sm font-semibold tracking-tight">
 Super Admins
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 The bootstrap account is created outside the registration flow from
 the environment configuration. The platform refuses to leave itself
 without at least one active Super Admin.
 </p>
 </div>

 <ul className="divide-y rounded-lg border bg-card">
 {superAdmins.map((admin) => (<li key={admin.id} className="flex items-center gap-4 px-4 py-3">
 <span className="min-w-0 flex-1">
 <span className="block font-medium">{admin.name}</span>
 <span className="block truncate text-xs text-muted-foreground">
 {admin.email}
 </span>
 </span>
 <span className="tabular hidden text-xs text-muted-foreground sm:block">
 since {formatDateTime(admin.createdAt)}
 </span>
 </li>))}
 </ul>
 </section>

 <section aria-labelledby="data-heading" className="space-y-3">
 <h2 id="data-heading" className="text-sm font-semibold tracking-tight">
 Stored data
 </h2>
 <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
 {[
            ["Accounts", userCount],
            ["Contests", contestCount],
            ["Problems", problemCount],
            ["Ratings", voteCount],
            ["Audit entries", auditCount],
        ].map(([label, value]) => (<div key={label as string} className="rounded-lg border bg-card px-4 py-3">
 <dt className="text-xs text-muted-foreground">{label}</dt>
 <dd className="tabular mt-1 text-lg font-semibold">{value}</dd>
 </div>))}
 </dl>
 </section>
 </div>);
}
