"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client/api-client";
export function SignOutButton({ variant = "ghost", className, showLabel = true, }: {
    variant?: React.ComponentProps<typeof Button>["variant"];
    className?: string;
    showLabel?: boolean;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const signOut = () => {
        startTransition(async () => {
            await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => undefined);
            router.replace("/login");
            router.refresh();
        });
    };
    return (<Button type="button" variant={variant} size="sm" className={className} onClick={signOut} disabled={pending}>
 {showLabel ? "Sign out" : <span className="sr-only">Sign out</span>}
 </Button>);
}
