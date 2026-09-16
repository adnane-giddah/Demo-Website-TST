import { PageShell } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
export default function AppLoading() {
    return (<PageShell>
 <div className="space-y-3">
 <Skeleton className="h-7 w-56"/>
 <Skeleton className="h-4 w-96 max-w-full"/>
 </div>

 <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
 {Array.from({ length: 3 }).map((_, index) => (<div key={index} className="space-y-4 rounded-lg border bg-card p-5">
 <div className="flex items-start justify-between gap-3">
 <Skeleton className="h-5 w-40"/>
 <Skeleton className="h-5 w-20"/>
 </div>
 <Skeleton className="h-4 w-full"/>
 <Skeleton className="h-4 w-3/5"/>
 <Skeleton className="h-1.5 w-full"/>
 </div>))}
 </div>
 </PageShell>);
}
