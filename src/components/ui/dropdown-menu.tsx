"use client";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (<DropdownMenuPrimitive.Portal>
 <DropdownMenuPrimitive.Content sideOffset={sideOffset} className={cn("z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground", "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95", className)} {...props}/>
 </DropdownMenuPrimitive.Portal>);
}
function DropdownMenuItem({ className, inset, variant = "default", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) {
    return (<DropdownMenuPrimitive.Item data-variant={variant} className={cn("relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none", "focus:bg-muted focus:text-foreground", "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive", inset && "pl-8", className)} {...props}/>);
}
function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (<DropdownMenuPrimitive.CheckboxItem className={cn("relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none", "focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} checked={checked} {...props}>
 <span className="absolute left-2 flex size-4 items-center justify-center">
 <DropdownMenuPrimitive.ItemIndicator>
 <span aria-hidden className="size-1.5 rounded-full bg-current"/>
 </DropdownMenuPrimitive.ItemIndicator>
 </span>
 {children}
 </DropdownMenuPrimitive.CheckboxItem>);
}
function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) {
    return (<DropdownMenuPrimitive.Label className={cn("px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase", inset && "pl-8", className)} {...props}/>);
}
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (<DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props}/>);
}
function DropdownMenuSubTrigger({ className, inset, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) {
    return (<DropdownMenuPrimitive.SubTrigger className={cn("flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-muted data-[state=open]:bg-muted", inset && "pl-8", className)} {...props}>
 {children}
 <span aria-hidden className="ml-auto text-muted-foreground">
 &gt;
 </span>
 </DropdownMenuPrimitive.SubTrigger>);
}
function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (<DropdownMenuPrimitive.SubContent className={cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground", className)} {...props}/>);
}
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, };
