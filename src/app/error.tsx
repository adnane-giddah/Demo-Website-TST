"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function GlobalError({ error, reset, }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    return (<div className="flex min-h-dvh items-center justify-center px-4 py-16">
 <div className="w-full max-w-sm text-center">
 <h1 className="text-base font-semibold tracking-tight">
 Something&rsquo;s not right
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 This page didn&rsquo;t load. Give it another try — if it keeps happening,
 let an administrator know and we&rsquo;ll sort it out.
 </p>

 {error.digest ? (<p className="mt-3 font-mono text-xs text-muted-foreground/70">
 Reference: {error.digest}
 </p>) : null}

 <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
 <Button onClick={reset}>Try again</Button>
 <Button asChild variant="outline">
 <Link href="/dashboard">Back to my contests</Link>
 </Button>
 </div>
 </div>
 </div>);
}
