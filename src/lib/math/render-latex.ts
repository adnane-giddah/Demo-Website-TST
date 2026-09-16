import katex from "katex";
type MathSegment = {
    tex: string;
    displayMode: boolean;
};
const PLACEHOLDER = "\u0000";
const KATEX_OPTIONS = {
    throwOnError: false,
    strict: false as const,
    trust: false,
    output: "htmlAndMathml" as const,
    errorColor: "#3a3a3a",
    maxSize: 40,
    maxExpand: 1000,
};
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function extractMath(source: string): {
    text: string;
    segments: MathSegment[];
} {
    const segments: MathSegment[] = [];
    let text = "";
    let index = 0;
    const push = (tex: string, displayMode: boolean) => {
        text += `${PLACEHOLDER}${segments.length}${PLACEHOLDER}`;
        segments.push({ tex, displayMode });
    };
    while (index < source.length) {
        const char = source[index];
        if (char === "\\") {
            const next = source[index + 1];
            if (next === "$") {
                text += "$";
                index += 2;
                continue;
            }
            if (next === "(") {
                const end = source.indexOf("\\)", index + 2);
                if (end !== -1) {
                    push(source.slice(index + 2, end), false);
                    index = end + 2;
                    continue;
                }
            }
            if (next === "[") {
                const end = source.indexOf("\\]", index + 2);
                if (end !== -1) {
                    push(source.slice(index + 2, end), true);
                    index = end + 2;
                    continue;
                }
            }
            text += char;
            index += 1;
            continue;
        }
        if (char === "$") {
            if (source[index + 1] === "$") {
                const end = source.indexOf("$$", index + 2);
                if (end !== -1) {
                    push(source.slice(index + 2, end), true);
                    index = end + 2;
                    continue;
                }
            }
            else {
                let cursor = index + 1;
                let end = -1;
                while (cursor < source.length) {
                    if (source[cursor] === "\\") {
                        cursor += 2;
                        continue;
                    }
                    if (source[cursor] === "$") {
                        end = cursor;
                        break;
                    }
                    cursor += 1;
                }
                if (end !== -1) {
                    push(source.slice(index + 1, end), false);
                    index = end + 1;
                    continue;
                }
            }
        }
        text += char;
        index += 1;
    }
    return { text, segments };
}
function renderSegment(segment: MathSegment): string {
    try {
        return katex.renderToString(segment.tex, {
            ...KATEX_OPTIONS,
            displayMode: segment.displayMode,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Invalid LaTeX";
        return `<span class="katex-error"title="${escapeHtml(message)}">${escapeHtml(segment.displayMode ? `\\[${segment.tex}\\]` : `\\(${segment.tex}\\)`)}</span>`;
    }
}
function assemble(text: string, rendered: string[]): string {
    const paragraphs = text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0);
    if (paragraphs.length === 0)
        return "";
    return paragraphs
        .map((block) => {
        const withBreaks = escapeHtml(block).replace(/\n/g, "<br />");
        const restored = withBreaks.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, "g"), (_match, id: string) => rendered[Number(id)] ?? "");
        return `<p>${restored}</p>`;
    })
        .join("");
}
export function renderLatexToHtml(source: string): string {
    if (!source)
        return "";
    const { text, segments } = extractMath(source);
    const rendered = segments.map(renderSegment);
    return assemble(text, rendered);
}
