import type { Metadata } from "next";
import { ContestForm } from "@/components/admin/contest-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireCapability } from "@/lib/auth/current-user";
export const metadata: Metadata = { title: "New contest" };
export default async function NewContestPage() {
    await requireCapability("contest:create");
    return (<div className="space-y-6">
 <PageHeader back={{ href: "/admin/contests", label: "Contests" }} title="New contest" description="It'll start as a draft that only administrators can see. Add your problems, grant access, then open it up for voting whenever you're ready."/>

 <ContestForm mode="create"/>
 </div>);
}
