"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiRequest } from "@/lib/client/api-client";
import { loginSchema } from "@/lib/validation/schemas";
type LoginValues = z.input<typeof loginSchema>;
export function LoginForm() {
    const router = useRouter();
    const [formError, setFormError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });
    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            const result = await apiRequest<{
                redirectTo: string;
            }>("/api/auth/login", {
                method: "POST",
                body: values,
            });
            router.replace(result.redirectTo);
            router.refresh();
        }
        catch (error) {
            setFormError(error instanceof ApiClientError
                ? error.message
                : "Something went wrong. Give it another try.");
        }
    });
    return (<form onSubmit={onSubmit} noValidate className="space-y-4 rounded-lg border bg-card p-6">
 <div className="space-y-1">
 <h2 className="text-base font-semibold tracking-tight">Sign in</h2>
 <p className="text-sm text-muted-foreground">
 Use the email address you signed up with.
 </p>
 </div>

 <FormAlert>{formError}</FormAlert>

 <Field label="Email" htmlFor="email" error={errors.email?.message}>
 <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")}/>
 </Field>

 <Field label="Password" htmlFor="password" error={errors.password?.message}>
 <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} {...register("password")}/>
 </Field>

 <Button type="submit" className="w-full" disabled={isSubmitting}>
 {isSubmitting ? "Signing in…" : "Sign in"}
 </Button>
 </form>);
}
