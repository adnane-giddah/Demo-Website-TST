import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/shared/brand";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { getCurrentUser } from "@/lib/auth/current-user";
export const metadata: Metadata = { title: "Awaiting approval" };
export default async function PendingPage() {
    const user = await getCurrentUser();
    if (!user)
        redirect("/login");
    if (user.status !== "PENDING")
        redirect("/dashboard");
    return (<div className="flex min-h-dvh items-center justify-center px-4 py-10">
 <div className="w-full max-w-sm">
 <div className="mb-8 flex justify-center">
 <BrandMark className="h-14" priority/>
 </div>

 <div className="border bg-card p-6 text-center">
 <h1 className="text-base font-semibold tracking-tight">
 Hang tight — you&rsquo;re almost in
 </h1>

 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 An administrator just needs to look over your account. Once they do,
 you&rsquo;ll be able to see contests and start rating problems.
 </p>

 <dl className="mt-5 space-y-1.5 border-t pt-4 text-left text-sm">
 <div className="flex justify-between gap-4">
 <dt className="text-muted-foreground">Name</dt>
 <dd className="truncate font-medium">{user.name}</dd>
 </div>
 <div className="flex justify-between gap-4">
 <dt className="text-muted-foreground">Email</dt>
 <dd className="truncate font-medium">{user.email}</dd>
 </div>
 </dl>

 <div className="mt-5">
 <SignOutButton variant="outline" className="w-full"/>
 </div>
 </div>
 </div>
 </div>);
}
