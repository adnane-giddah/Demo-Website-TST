"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { contestCreateSchema } from "@/lib/validation/schemas";
type ContestValues = z.input<typeof contestCreateSchema>;
const STATUS_HELP: Record<string, string> = {
    DRAFT: "Only administrators can see this contest.",
    OPEN: "Authorised members can read the problems, and those with voting permission can rate them.",
    CLOSED: "Members keep read access and can see their own ratings, but can no longer change them.",
    ARCHIVED: "Kept for the record. No voting; administrators can still inspect the results.",
};
export function ContestForm({ contest, mode, }: {
    mode: "create" | "edit";
    contest?: {
        id: string;
        title: string;
        description: string | null;
        eventDate: Date | null;
        status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
    };
}) {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const { register, control, handleSubmit, formState: { errors, isSubmitting, isDirty }, } = useForm<ContestValues>({
        resolver: zodResolver(contestCreateSchema),
        defaultValues: {
            title: contest?.title ?? "",
            description: contest?.description ?? "",
            eventDate: contest?.eventDate
                ? contest.eventDate.toISOString().slice(0, 10)
                : "",
            status: contest?.status ?? "DRAFT",
        },
    });
    const status = useWatch({ control, name: "status" }) ?? "DRAFT";
    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            if (mode === "create") {
                const result = await apiRequest<{
                    contest: {
                        id: string;
                    };
                }>("/api/admin/contests", { method: "POST", body: values });
                toast.success("Contest created.");
                router.push(`/admin/contests/${result.contest.id}`);
            }
            else {
                await apiRequest(`/api/admin/contests/${contest!.id}`, {
                    method: "PATCH",
                    body: values,
                });
                toast.success("Contest updated.");
                router.refresh();
            }
        }
        catch (error) {
            setFormError(error instanceof ApiClientError
                ? error.message
                : "Couldn't save the contest.");
        }
    });
    return (<form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-5">
 <FormAlert>{formError}</FormAlert>

 <Field label="Title" htmlFor="title" error={errors.title?.message}>
 <Input id="title" autoFocus={mode === "create"} placeholder="IMO Selection 2026" aria-invalid={!!errors.title} {...register("title")}/>
 </Field>

 <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Shown to members on their dashboard and at the top of the contest.">
 <Textarea id="description" rows={3} placeholder="Problem selection session for the 2026 team." {...register("description")}/>
 </Field>

 <div className="grid gap-5 sm:grid-cols-2">
 <Field label="Date" htmlFor="eventDate" error={errors.eventDate?.message} hint="Optional.">
 <Input id="eventDate" type="date" {...register("eventDate")}/>
 </Field>

 <Field label="Status" htmlFor="status" error={errors.status?.message} hint={STATUS_HELP[status as string]}>
 <Controller control={control} name="status" render={({ field }) => (<Select value={field.value} onValueChange={field.onChange}>
 <SelectTrigger id="status">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="DRAFT">Draft</SelectItem>
 <SelectItem value="OPEN">Open for voting</SelectItem>
 <SelectItem value="CLOSED">Closed</SelectItem>
 <SelectItem value="ARCHIVED">Archived</SelectItem>
 </SelectContent>
 </Select>)}/>
 </Field>
 </div>

 <div className="flex items-center gap-2 pt-1">
 <Button type="submit" disabled={isSubmitting || (mode === "edit" && !isDirty)}>
 {isSubmitting
            ? "Saving…" : mode === "create" ? "Create contest" : "Save changes"}
 </Button>
 <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
 Cancel
 </Button>
 </div>
 </form>);
}
