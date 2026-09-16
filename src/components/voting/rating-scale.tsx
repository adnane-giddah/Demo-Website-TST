"use client";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { RATING_MAX, RATING_MIN } from "@/lib/validation/schemas";
const VALUES = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, index) => RATING_MIN + index);
type RatingScaleProps = {
    label: string;
    description?: string;
    endpoints?: [
        string,
        string
    ];
    value: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
};
export function RatingScale({ label, description, endpoints, value, onChange, disabled = false, }: RatingScaleProps) {
    const groupId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const focusValue = (next: number) => {
        const clamped = Math.min(RATING_MAX, Math.max(RATING_MIN, next));
        onChange(clamped);
        const button = containerRef.current?.querySelector<HTMLButtonElement>(`[data-value="${clamped}"]`);
        button?.focus();
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled)
            return;
        const current = value ?? RATING_MIN - 1;
        switch (event.key) {
            case "ArrowRight":
            case "ArrowUp":
                event.preventDefault();
                focusValue(value === null ? RATING_MIN : current + 1);
                break;
            case "ArrowLeft":
            case "ArrowDown":
                event.preventDefault();
                focusValue(value === null ? RATING_MAX : current - 1);
                break;
            case "Home":
                event.preventDefault();
                focusValue(RATING_MIN);
                break;
            case "End":
                event.preventDefault();
                focusValue(RATING_MAX);
                break;
            default:
                break;
        }
    };
    const tabbableValue = value ?? RATING_MIN;
    return (<div className="space-y-2.5">
 <div className="flex items-baseline justify-between gap-3">
 <span id={`${groupId}-label`} className="text-sm font-medium">
 {label}
 </span>
 <span className={cn("tabular text-sm", value === null ? "text-muted-foreground" : "font-semibold")}>
 {value === null ? "Not rated" : `${value} / ${RATING_MAX}`}
 </span>
 </div>

 {description ? (<p id={`${groupId}-description`} className="text-xs text-muted-foreground">
 {description}
 </p>) : null}

 <div ref={containerRef} role="radiogroup" aria-labelledby={`${groupId}-label`} aria-describedby={description ? `${groupId}-description` : undefined} aria-disabled={disabled || undefined} onKeyDown={handleKeyDown} className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-1.5">
 {VALUES.map((option) => {
            const selected = value === option;
            return (<button key={option} type="button" role="radio" aria-checked={selected} aria-label={`${label}: ${option} out of ${RATING_MAX}`} data-value={option} tabIndex={option === tabbableValue ? 0 : -1} disabled={disabled} onClick={() => onChange(option)} className={cn("tabular flex h-11 items-center justify-center rounded-md border text-sm font-medium transition-colors sm:h-10", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", selected
                    ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-scale-track text-muted-foreground", !selected && !disabled && "hover:bg-scale-hover hover:text-foreground", disabled && "cursor-not-allowed opacity-55")}>
 {option}
 </button>);
        })}
 </div>

 {endpoints ? (<div aria-hidden className="flex justify-between text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
 <span>{endpoints[0]}</span>
 <span>{endpoints[1]}</span>
 </div>) : null}
 </div>);
}
