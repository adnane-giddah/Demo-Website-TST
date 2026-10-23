import type { Metadata } from "next";
import { DemoShell } from "@/components/demo/demo-shell";
export const metadata: Metadata = { title: "Demo as an administrator" };
export default function DemoLayout({ children }: {
    children: React.ReactNode;
}) {
    return <DemoShell>{children}</DemoShell>;
}
