import { DemoUsersTable } from "@/components/demo/demo-users-table";
import { PageHeader } from "@/components/shared/page-header";
export default function DemoUsersPage() {
    return (<div className="space-y-6">
 <PageHeader title="Users" description="Approve, suspend or reinstate accounts. Changes reset when you reload."/>
 <DemoUsersTable />
 </div>);
}
