import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
    return (<div className="flex min-h-dvh items-center justify-center px-4 py-16">
 <div className="w-full max-w-sm text-center">
 <h1 className="text-base font-semibold tracking-tight">We can&rsquo;t find that page</h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 It doesn&rsquo;t exist, or you don&rsquo;t have access to it — either way, it&rsquo;s not here.
 </p>

 <Button asChild className="mt-6">
 <Link href="/dashboard">Back to my contests</Link>
 </Button>
 </div>
 </div>);
}
