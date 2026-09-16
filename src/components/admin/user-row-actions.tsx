"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Role, UserStatus } from "@prisma/client";
import { ConfirmDialog, type ConfirmOptions, } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
type TargetUser = {
    id: string;
    name: string;
    role: Role;
    status: UserStatus;
};
type PendingAction = {
    patch: {
        status?: UserStatus;
        role?: Role;
    };
    confirm: ConfirmOptions;
    success: string;
};
export function UserRowActions({ user, actorRole, actorId, }: {
    user: TargetUser;
    actorRole: Role;
    actorId: string;
}) {
    const router = useRouter();
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [busy, setBusy] = useState(false);
    const isSelf = user.id === actorId;
    const isSuperAdmin = actorRole === "SUPER_ADMIN";
    const canManage = !isSelf && (isSuperAdmin || user.role === "USER");
    const run = async (action: PendingAction) => {
        setBusy(true);
        try {
            await apiRequest(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                body: action.patch,
            });
            toast.success(action.success);
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof ApiClientError
                ? error.message
                : "Couldn't update that account.");
        }
        finally {
            setBusy(false);
        }
    };
    const quick = (action: PendingAction) => {
        void run(action);
    };
    if (!canManage) {
        return (<span className="text-xs text-muted-foreground">
 {isSelf ? "This is you" : "—"}
 </span>);
    }
    const approve: PendingAction = {
        patch: { status: "APPROVED" },
        confirm: { title: "", description: "" },
        success: `${user.name} can now sign in.`,
    };
    const reject: PendingAction = {
        patch: { status: "REMOVED" },
        confirm: {
            title: `Reject the request from ${user.name}?`,
            description: "We'll keep the account but mark it removed, and they won't be able to sign in. You can reactivate it later.",
            confirmLabel: "Reject request",
            destructive: true,
        },
        success: `Rejected the request from ${user.name}.`,
    };
    const suspend: PendingAction = {
        patch: { status: "SUSPENDED" },
        confirm: {
            title: `Suspend ${user.name}?`,
            description: "They'll be signed out right away and can't sign back in until you reactivate them. Their contest access and existing ratings stay put.",
            confirmLabel: "Suspend",
            destructive: true,
        },
        success: `${user.name} has been suspended.`,
    };
    const reactivate: PendingAction = {
        patch: { status: "APPROVED" },
        confirm: { title: "", description: "" },
        success: `${user.name} has been reactivated.`,
    };
    const remove: PendingAction = {
        patch: { status: "REMOVED" },
        confirm: {
            title: `Remove access for ${user.name}?`,
            description: "They'll be signed out and won't be able to sign in. Their account and rating history stay safe, and you can restore access later.",
            confirmLabel: "Remove access",
            destructive: true,
        },
        success: `Removed platform access for ${user.name}.`,
    };
    const grantAdmin: PendingAction = {
        patch: { role: "ADMIN" },
        confirm: {
            title: `Make ${user.name} an administrator?`,
            description: "Administrators can create contests, manage problems, set voting weights and see every individual rating.",
            confirmLabel: "Make administrator",
        },
        success: `${user.name} is now an administrator.`,
    };
    const revokeAdmin: PendingAction = {
        patch: { role: "USER" },
        confirm: {
            title: `Remove administrator rights from ${user.name}?`,
            description: "They'll keep their account and contest access, just lose the administration area, results and weights.",
            confirmLabel: "Remove rights",
            destructive: true,
        },
        success: `${user.name} is no longer an administrator.`,
    };
    return (<div className="flex items-center justify-end gap-1.5">
 
 {user.status === "PENDING" ? (<>
 <Button size="sm" disabled={busy} onClick={() => quick(approve)}>
 Approve
 </Button>
 
 <Button size="sm" variant="outline" disabled={busy} onClick={() => setPending(reject)} className="hidden sm:inline-flex">
 Reject
 </Button>
 </>) : user.status === "APPROVED" ? (<Button size="sm" variant="outline" disabled={busy} onClick={() => setPending(suspend)}>
 Suspend
 </Button>) : (<Button size="sm" variant="outline" disabled={busy} onClick={() => quick(reactivate)}>
 Reactivate
 </Button>)}

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon-sm" disabled={busy} aria-label={`More actions for ${user.name}`}>
 <span aria-hidden>&#8943;</span>
 </Button>
 </DropdownMenuTrigger>

 <DropdownMenuContent align="end">
 {isSuperAdmin ? (<>
 {user.role === "USER" ? (<DropdownMenuItem onSelect={() => setPending(grantAdmin)}>
 Make administrator
 </DropdownMenuItem>) : (<DropdownMenuItem onSelect={() => setPending(revokeAdmin)}>
 Remove administrator rights
 </DropdownMenuItem>)}
 <DropdownMenuSeparator />
 </>) : null}

 
 {user.status === "PENDING" ? (<DropdownMenuItem variant="destructive" className="sm:hidden" onSelect={() => setPending(reject)}>
 Reject request
 </DropdownMenuItem>) : null}

 {user.status !== "SUSPENDED" && user.status !== "PENDING" ? (<DropdownMenuItem onSelect={() => setPending(suspend)}>
 Suspend
 </DropdownMenuItem>) : null}

 {user.status !== "REMOVED" ? (<DropdownMenuItem variant="destructive" onSelect={() => setPending(remove)}>
 Remove access
 </DropdownMenuItem>) : null}
 </DropdownMenuContent>
 </DropdownMenu>

 <ConfirmDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)} options={pending?.confirm ?? null} onConfirm={async () => {
            if (pending)
                await run(pending);
        }}/>
 </div>);
}
