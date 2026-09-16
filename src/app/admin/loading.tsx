import { Skeleton } from "@/components/ui/skeleton";
export default function AdminLoading() {
    return (<div className="space-y-6">
 <div className="space-y-3">
 <Skeleton className="h-7 w-64"/>
 <Skeleton className="h-4 w-96 max-w-full"/>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {Array.from({ length: 4 }).map((_, index) => (<div key={index} className="space-y-2 rounded-lg border bg-card px-4 py-3.5">
 <Skeleton className="h-4 w-28"/>
 <Skeleton className="h-7 w-14"/>
 </div>))}
 </div>

 <div className="rounded-lg border bg-card">
 {Array.from({ length: 6 }).map((_, index) => (<div key={index} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
 <Skeleton className="h-4 flex-1"/>
 <Skeleton className="hidden h-4 w-32 sm:block"/>
 <Skeleton className="h-5 w-20"/>
 </div>))}
 </div>
 </div>);
}
