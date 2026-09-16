import Link from "next/link";
import { ProblemEditor } from "@/components/admin/problem-editor";
import { requireCapability } from "@/lib/auth/current-user";
export default async function NewProblemPage({ params, }: {
    params: Promise<{
        contestId: string;
    }>;
}) {
    await requireCapability("problem:create");
    const { contestId } = await params;
    return (<div className="space-y-5">
 <div className="flex items-center justify-between gap-3">
 <Link href={`/admin/contests/${contestId}/problems`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
 &lsaquo; All problems
 </Link>
 </div>

 <h2 className="text-base font-semibold tracking-tight">Add a problem</h2>

 <ProblemEditor contestId={contestId} mode="create"/>
 </div>);
}
