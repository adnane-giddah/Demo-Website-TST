"use client";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export type ConfirmOptions = {
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};
export function ConfirmDialog({ open, onOpenChange, options, onConfirm, }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: ConfirmOptions | null;
    onConfirm: () => Promise<void> | void;
}) {
    const [working, setWorking] = useState(false);
    if (!options)
        return null;
    const confirm = async (event: React.MouseEvent) => {
        event.preventDefault();
        setWorking(true);
        try {
            await onConfirm();
            onOpenChange(false);
        }
        finally {
            setWorking(false);
        }
    };
    return (<AlertDialog open={open} onOpenChange={working ? undefined : onOpenChange}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>{options.title}</AlertDialogTitle>
 <AlertDialogDescription asChild>
 <div>{options.description}</div>
 </AlertDialogDescription>
 </AlertDialogHeader>

 <AlertDialogFooter>
 <AlertDialogCancel disabled={working}>
 {options.cancelLabel ?? "Cancel"}
 </AlertDialogCancel>
 <AlertDialogAction onClick={confirm} disabled={working} className={cn(options.destructive &&
            buttonVariants({ variant: "destructive" }))}>
 {working ? "Working…" : (options.confirmLabel ?? "Confirm")}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>);
}
