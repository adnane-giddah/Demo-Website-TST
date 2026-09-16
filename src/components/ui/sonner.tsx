"use client";
import { Toaster as SonnerToaster } from "sonner";
export function Toaster() {
    return (<SonnerToaster position="bottom-right" gap={10} offset={20} toastOptions={{
            classNames: {
                toast: "group flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-card-foreground",
                title: "font-medium",
                description: "text-muted-foreground text-[0.8125rem]",
                actionButton: "rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground",
                cancelButton: "rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground",
                error: "border-destructive/40 [&_[data-icon]]:text-destructive",
                success: "border-success/40 [&_[data-icon]]:text-success",
                warning: "border-warning/50 [&_[data-icon]]:text-warning",
            },
        }}/>);
}
