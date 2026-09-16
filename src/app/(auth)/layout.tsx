import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/shared/brand";
import { getCurrentUser } from "@/lib/auth/current-user";
export default async function AuthLayout({ children, }: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();
    if (user)
        redirect(user.status === "PENDING" ? "/pending" : "/dashboard");
    return (<div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
 <div className="w-full max-w-sm">
 <div className="mb-8 flex flex-col items-center gap-3 text-center">
 <BrandMark className="h-16" priority/>
 <div>
 <h1 className="text-lg font-semibold tracking-tight">Olympiad Portal</h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Where our committee builds and rates olympiad problems together
 </p>
 </div>
 </div>

 {children}

 <p className="mt-8 text-center text-xs text-muted-foreground">
 Our committee reviews every request by hand.{" "}
 <Link href="/register" className="underline underline-offset-2 hover:text-foreground">
 Ask for an account
 </Link>
 </p>
 </div>
 </div>);
}
