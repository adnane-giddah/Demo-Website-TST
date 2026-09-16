import Link from "next/link";
import { PermissionsTable } from "@/components/admin/permissions-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth/current-user";
import { listContestParticipants } from "@/lib/services/permission-service";
export default async function ContestUsersPage({ params, }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("weight:read");
    const { contestId } = await params;
    const participants = await listContestParticipants(contestId);
    return (<div className="space-y-4">
 <div>
 <h2 className="text-sm font-semibold tracking-tight">Access and voting</h2>
 <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
 Approving someone, giving them access to this contest, and letting them
 vote are three separate calls you get to make. Someone can be approved
 on the platform but have no access here, or have access but no vote.
 Weights only apply to this contest, and members never see them.
 </p>
 </div>

 {participants.length === 0 ? (<EmptyState title="No members to add yet" description="Approve some accounts first, and they'll show up here ready to be given access." action={<Button asChild size="sm">
 <Link href="/admin/users">Manage users</Link>
 </Button>}/>) : (<PermissionsTable contestId={contestId} participants={participants}/>)}
 </div>);
}
