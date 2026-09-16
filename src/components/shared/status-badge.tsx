import type { ContestStatus, Role, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const CONTEST_STATUS: Record<ContestStatus, {
    label: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
}> = {
    DRAFT: { label: "Draft", variant: "muted" },
    OPEN: { label: "Voting open", variant: "success" },
    CLOSED: { label: "Closed", variant: "secondary" },
    ARCHIVED: { label: "Archived", variant: "outline" },
};
export function ContestStatusBadge({ status, className, }: {
    status: ContestStatus;
    className?: string;
}) {
    const { label, variant } = CONTEST_STATUS[status];
    return (<Badge variant={variant} className={className}>
 {label}
 </Badge>);
}
const USER_STATUS: Record<UserStatus, {
    label: string;
    variant: React.ComponentProps<typeof Badge>["variant"];
}> = {
    PENDING: { label: "Pending", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    SUSPENDED: { label: "Suspended", variant: "destructive" },
    REMOVED: { label: "Removed", variant: "muted" },
};
export function UserStatusBadge({ status, className, }: {
    status: UserStatus;
    className?: string;
}) {
    const { label, variant } = USER_STATUS[status];
    return (<Badge variant={variant} className={className}>
 {label}
 </Badge>);
}
const ROLE_LABEL: Record<Role, string> = {
    USER: "Member",
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Admin",
};
export function RoleBadge({ role, className }: {
    role: Role;
    className?: string;
}) {
    if (role === "USER") {
        return (<span className={cn("text-sm text-muted-foreground", className)}>
 {ROLE_LABEL.USER}
 </span>);
    }
    return (<Badge variant={role === "SUPER_ADMIN" ? "default" : "secondary"} className={className}>
 {ROLE_LABEL[role]}
 </Badge>);
}
export { CONTEST_STATUS, USER_STATUS, ROLE_LABEL };
