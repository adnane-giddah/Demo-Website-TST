import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
const LOGO_WIDTH = 498;
const LOGO_HEIGHT = 345;
export function BrandMark({ className, priority = false, }: {
    className?: string;
    priority?: boolean;
}) {
    const common = {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT,
        priority, "aria-hidden": true as const,
    };
    return (<>
 <Image {...common} alt="" src="/logo.png" className={cn("w-auto object-contain dark:hidden", className)}/>
 <Image {...common} alt="" src="/logo-dark.png" className={cn("hidden w-auto object-contain dark:block", className)}/>
 </>);
}
export function BrandLock({ href = "/dashboard", subtitle, className, }: {
    href?: string;
    subtitle?: string;
    className?: string;
}) {
    return (<Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
 <BrandMark className="h-7" priority/>
 <span className="flex flex-col leading-tight">
 <span className="text-sm font-semibold tracking-tight">Olympiad Portal</span>
 {subtitle ? (<span className="text-xs text-muted-foreground">{subtitle}</span>) : null}
 </span>
 </Link>);
}
