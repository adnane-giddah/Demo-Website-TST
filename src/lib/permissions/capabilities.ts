import type { Role } from "@prisma/client";
export const CAPABILITIES = ["user:read", "user:approve", "user:reject", "user:suspend", "user:reactivate", "user:remove", "admin:grant", "admin:revoke", "contest:read_all", "contest:create", "contest:update", "contest:delete", "contest:duplicate", "contest:change_status", "problem:create", "problem:update", "problem:delete", "problem:reorder", "problem:read_private_notes", "permission:read", "permission:update", "weight:read", "weight:update", "results:read", "votes:read_all", "audit:read",
] as const;
export type Capability = (typeof CAPABILITIES)[number];
const ADMIN_CAPABILITIES: readonly Capability[] = CAPABILITIES.filter((capability) => capability !== "admin:grant" && capability !== "admin:revoke");
const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
    USER: new Set<Capability>(),
    ADMIN: new Set(ADMIN_CAPABILITIES),
    SUPER_ADMIN: new Set(CAPABILITIES),
};
export function hasCapability(role: Role, capability: Capability): boolean {
    return ROLE_CAPABILITIES[role].has(capability);
}
export function isAdminRole(role: Role): boolean {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}
export function canManageUser(actor: {
    id: string;
    role: Role;
}, target: {
    id: string;
    role: Role;
}): boolean {
    if (actor.id === target.id)
        return false;
    if (actor.role === "SUPER_ADMIN")
        return true;
    if (actor.role === "ADMIN")
        return target.role === "USER";
    return false;
}
