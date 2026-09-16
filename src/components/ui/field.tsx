import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
type FieldProps = {
    label: React.ReactNode;
    htmlFor: string;
    error?: string;
    hint?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
};
export function Field({ label, htmlFor, error, hint, className, children, }: FieldProps) {
    return (<div className={cn("space-y-1.5", className)}>
 <Label htmlFor={htmlFor}>{label}</Label>
 {children}
 {error ? (<p id={`${htmlFor}-error`} role="alert" className="text-[0.8125rem] text-destructive">
 {error}
 </p>) : hint ? (<p id={`${htmlFor}-hint`} className="text-[0.8125rem] text-muted-foreground">
 {hint}
 </p>) : null}
 </div>);
}
export function FormAlert({ children, className, }: {
    children: React.ReactNode;
    className?: string;
}) {
    if (!children)
        return null;
    return (<div role="alert" className={cn("rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[0.8125rem] text-destructive", className)}>
 {children}
 </div>);
}
