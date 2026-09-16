import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva("inline-flex items-center text-xs font-medium whitespace-nowrap", {
    variants: {
        variant: {
            default: "text-foreground",
            secondary: "text-muted-foreground",
            outline: "text-muted-foreground",
            success: "text-success",
            warning: "text-warning",
            destructive: "text-destructive",
            muted: "text-muted-foreground",
        },
    },
    defaultVariants: { variant: "default" },
});
function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
}) {
    const Comp = asChild ? Slot : "span";
    return (<Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}/>);
}
export { Badge, badgeVariants };
