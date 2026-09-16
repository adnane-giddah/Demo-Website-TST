"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { registerSchema } from "@/lib/validation/schemas";
type RegisterValues = z.input<typeof registerSchema>;
export function RegisterForm() {
    const [formError, setFormError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, setError, formState: { errors, isSubmitting }, } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    });
    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            await apiRequest("/api/auth/register", { method: "POST", body: values });
            setSubmitted(true);
        }
        catch (error) {
            if (error instanceof ApiClientError) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (field in values && messages[0]) {
                        setError(field as keyof RegisterValues, { message: messages[0] });
                    }
                }
                setFormError(error.message);
            }
            else {
                setFormError("Something went wrong. Give it another try.");
            }
        }
    });
    if (submitted) {
        return (<div className="rounded-lg border bg-card p-6 text-center">
 <h2 className="text-base font-semibold tracking-tight">
 You&rsquo;re almost in
 </h2>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Your account is set up and just needs a nod from an administrator.
 You&rsquo;ll be able to sign in as soon as that happens.
 </p>
 <Button asChild variant="outline" className="mt-5 w-full">
 <Link href="/login">Back to sign in</Link>
 </Button>
 </div>);
    }
    return (<form onSubmit={onSubmit} noValidate className="space-y-4 rounded-lg border bg-card p-6">
 <div className="space-y-1">
 <h2 className="text-base font-semibold tracking-tight">Request an account</h2>
 <p className="text-sm text-muted-foreground">
 One of our administrators looks over every request personally.
 </p>
 </div>

 <FormAlert>{formError}</FormAlert>

 <Field label="Name" htmlFor="name" error={errors.name?.message}>
 <Input id="name" autoComplete="name" autoFocus placeholder="Ada Lovelace" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")}/>
 </Field>

 <Field label="Email" htmlFor="email" error={errors.email?.message}>
 <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")}/>
 </Field>

 <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 10 characters, including a letter and a number.">
 <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : "password-hint"} {...register("password")}/>
 </Field>

 <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
 <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined} {...register("confirmPassword")}/>
 </Field>

 <Button type="submit" className="w-full" disabled={isSubmitting}>
 {isSubmitting ? "Creating account…" : "Create account"}
 </Button>

 <p className="text-center text-sm text-muted-foreground">
 Already have an account?{" "}
 <Link href="/login" className="text-foreground underline underline-offset-2">
 Sign in
 </Link>
 </p>
 </form>);
}
