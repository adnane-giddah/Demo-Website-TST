"use client";
import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { cn } from "@/lib/utils";
export type FilterDefinition = {
    name: string;
    label: string;
    options: Array<{
        value: string;
        label: string;
    }>;
    defaultValue?: string;
};
export function TableFilters({ searchPlaceholder = "Search...", filters = [], className, }: {
    searchPlaceholder?: string;
    filters?: FilterDefinition[];
    className?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const currentSearch = searchParams.get("search") ?? "";
    const [search, setSearch] = useState(currentSearch);
    const [lastUrlSearch, setLastUrlSearch] = useState(currentSearch);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    if (currentSearch !== lastUrlSearch) {
        setLastUrlSearch(currentSearch);
        setSearch(currentSearch);
    }
    const push = (mutate: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams.toString());
        mutate(params);
        const query = params.toString();
        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
    };
    const onSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            push((params) => {
                if (value.trim())
                    params.set("search", value.trim());
                else
                    params.delete("search");
            });
        }, 300);
    };
    const hasActiveFilters = currentSearch !== "" ||
        filters.some((filter) => {
            const value = searchParams.get(filter.name);
            return value !== null && value !== (filter.defaultValue ?? "ALL");
        });
    return (<div className={cn("flex flex-wrap items-center gap-2", className)}>
 <div className="min-w-52 flex-1 sm:max-w-xs">
 <Input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}/>
 </div>

 {filters.map((filter) => {
            const value = searchParams.get(filter.name) ?? filter.defaultValue ?? "ALL";
            return (<Select key={filter.name} value={value} onValueChange={(next) => push((params) => {
                    if (next === (filter.defaultValue ?? "ALL"))
                        params.delete(filter.name);
                    else
                        params.set(filter.name, next);
                })}>
 <SelectTrigger className="w-auto min-w-36" aria-label={filter.label}>
 <SelectValue placeholder={filter.label}/>
 </SelectTrigger>
 <SelectContent>
 {filter.options.map((option) => (<SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>))}
 </SelectContent>
 </Select>);
        })}

 {hasActiveFilters ? (<Button variant="ghost" size="sm" onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}>
 Clear
 </Button>) : null}

 {isPending ? (<span className="text-xs text-muted-foreground">Updating…</span>) : null}
 </div>);
}
