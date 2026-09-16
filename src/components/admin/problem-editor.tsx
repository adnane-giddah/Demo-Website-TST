"use client";
import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { MathContent } from "@/components/math/math-content";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { cn } from "@/lib/utils";
import { problemCreateSchema } from "@/lib/validation/schemas";
type ProblemValues = z.input<typeof problemCreateSchema>;
const DELIMITER_HELP = [
    { syntax: "\\( ... \\)", meaning: "inline" },
    { syntax: "\\[ ... \\]", meaning: "display" },
    { syntax: "$ ... $", meaning: "inline" },
    { syntax: "$$ ... $$", meaning: "display" },
];
export function ProblemEditor({ contestId, problem, mode, }: {
    contestId: string;
    mode: "create" | "edit";
    problem?: {
        id: string;
        position: number;
        title: string;
        statementLatex: string;
        source: string | null;
        privateNotes: string | null;
    };
}) {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting, isDirty }, } = useForm<ProblemValues>({
        resolver: zodResolver(problemCreateSchema),
        defaultValues: {
            title: problem?.title ?? "",
            statementLatex: problem?.statementLatex ?? "",
            source: problem?.source ?? "",
            privateNotes: problem?.privateNotes ?? "",
        },
    });
    const statement = useWatch({ control, name: "statementLatex" }) ?? "";
    const previewSource = useDeferredValue(statement);
    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            if (mode === "create") {
                await apiRequest(`/api/admin/contests/${contestId}/problems`, {
                    method: "POST",
                    body: values,
                });
                toast.success("Problem added.");
                router.push(`/admin/contests/${contestId}/problems`);
            }
            else {
                await apiRequest(`/api/admin/contests/${contestId}/problems/${problem!.id}`, { method: "PATCH", body: values });
                toast.success("Problem saved.");
                reset(values);
                router.refresh();
            }
        }
        catch (error) {
            setFormError(error instanceof ApiClientError ? error.message : "Couldn't save the problem.");
        }
    }, () => {
        setMobileView("edit");
        setFormError("Please correct the highlighted fields, then save again.");
    });
    const editorPane = (<div className="space-y-4">
 <Field label="Title" htmlFor="title" error={errors.title?.message}>
 <Input id="title" placeholder="Geometry" autoFocus={mode === "create"} aria-invalid={!!errors.title} {...register("title")}/>
 </Field>

 <Field label="Statement" htmlFor="statementLatex" error={errors.statementLatex?.message}>
 <Textarea id="statementLatex" rows={18} spellCheck={false} className="latex-editor min-h-72 resize-y" placeholder={"Let \\(ABC\\) be a triangle such that...\n\n\\[ x^2 + y^2 = z^2 \\]\n\nProve that..."} aria-invalid={!!errors.statementLatex} {...register("statementLatex")}/>
 </Field>

 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
 {DELIMITER_HELP.map((item) => (<span key={item.syntax} className="whitespace-nowrap">
 <code className="rounded bg-muted px-1 py-0.5 font-mono">
 {item.syntax}
 </code>{" "}
 {item.meaning}
 </span>))}
 </div>

 <Field label="Source" htmlFor="source" error={errors.source?.message} hint="Optional. Shown to members above the statement.">
 <Input id="source" placeholder="Shortlist 2024 N3" {...register("source")}/>
 </Field>

 <Field label="Private notes" htmlFor="privateNotes" error={errors.privateNotes?.message} hint="Administrators only. Never shown to members.">
 <Textarea id="privateNotes" rows={3} placeholder="Solution sketch, concerns, where this problem should sit." {...register("privateNotes")}/>
 </Field>
 </div>);
    const previewPane = (<div className="rounded-lg border bg-paper px-5 py-6 sm:px-7">
 {previewSource.trim() ? (<MathContent source={previewSource}/>) : (<p className="text-sm text-muted-foreground italic">
 The rendered statement will appear here as you type.
 </p>)}
 </div>);
    return (<form onSubmit={onSubmit} noValidate className="space-y-5">
 <FormAlert>{formError}</FormAlert>

 
 <div role="group" aria-label="Editor view" className="flex gap-1 rounded-md bg-muted p-1 lg:hidden">
 {([
            ["edit", "Edit"],
            ["preview", "Preview"],
        ] as const).map(([value, label]) => (<button key={value} type="button" aria-pressed={mobileView === value} onClick={() => setMobileView(value)} className={cn("flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors", mobileView === value
                ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
 {label}
 </button>))}
 </div>

 <div className="grid gap-6 lg:grid-cols-2">
 <div className={cn(mobileView === "preview" && "hidden lg:block")}>
 {editorPane}
 </div>

 <div className={cn("lg:sticky lg:top-20 lg:self-start", mobileView === "edit" && "hidden lg:block")}>
 <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
 Live preview
 </p>
 {previewPane}
 </div>
 </div>

 <div className="flex items-center gap-2 border-t pt-5">
 <Button type="submit" disabled={isSubmitting || (mode === "edit" && !isDirty)}>
 {isSubmitting
            ? "Saving…" : mode === "create" ? "Add problem" : "Save changes"}
 </Button>
 <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => {
            if (mode === "edit" && problem) {
                reset({
                    title: problem.title,
                    statementLatex: problem.statementLatex,
                    source: problem.source ?? "",
                    privateNotes: problem.privateNotes ?? "",
                });
            }
            else {
                router.push(`/admin/contests/${contestId}/problems`);
            }
        }}>
 Cancel
 </Button>

 {mode === "edit" && isDirty ? (<span className="text-xs text-muted-foreground">Unsaved changes</span>) : null}
 </div>
 </form>);
}
