import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function formatScore(value: number | null | undefined, digits = 2) {
    if (value === null || value === undefined || Number.isNaN(value))
        return "—";
    return value.toFixed(digits);
}
export function formatWeight(value: number | string) {
    const n = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(n))
        return "—";
    return String(Number(n.toFixed(2)));
}
export function initialsOf(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});
export function formatDate(date: Date | string) {
    return DATE_FORMAT.format(new Date(date));
}
export function formatDateTime(date: Date | string) {
    return DATE_TIME_FORMAT.format(new Date(date)).replace(", ", " — ");
}
