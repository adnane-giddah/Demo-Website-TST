"use client";
const STORAGE_KEY = "olympiad-theme";
export function ThemeToggle() {
    const toggle = () => {
        const root = document.documentElement;
        const next = !root.classList.contains("dark");
        root.classList.toggle("dark", next);
        root.style.colorScheme = next ? "dark" : "light";
        try {
            localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
        }
        catch {
        }
    };
    return (<button type="button" onClick={toggle} aria-label="Switch between light and dark theme" className="flex size-8 items-center justify-center">
      <span aria-hidden className="size-3 rounded-full bg-foreground"/>
    </button>);
}
