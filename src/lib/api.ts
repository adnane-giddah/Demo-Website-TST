import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, ValidationError } from "@/lib/errors";
export type ApiErrorBody = {
    error: string;
    code: string;
    fieldErrors?: Record<string, string[]>;
};
export function jsonOk<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}
export function errorResponse(error: unknown) {
    if (error instanceof ValidationError) {
        return NextResponse.json<ApiErrorBody>({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: error.status });
    }
    if (error instanceof AppError) {
        return NextResponse.json<ApiErrorBody>({ error: error.message, code: error.code }, {
            status: error.status,
            headers: error.code === "RATE_LIMITED" ? { "Retry-After": String((error as {
                    retryAfterSeconds?: number;
                }).retryAfterSeconds ?? 60) }
                : undefined,
        });
    }
    if (error instanceof z.ZodError) {
        const flattened = z.flattenError(error);
        return NextResponse.json<ApiErrorBody>({
            error: "Some of the information provided is not valid.",
            code: "VALIDATION_ERROR",
            fieldErrors: flattened.fieldErrors as Record<string, string[]>,
        }, { status: 422 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return NextResponse.json<ApiErrorBody>({ error: "That already exists.", code: "CONFLICT" }, { status: 409 });
        }
        if (error.code === "P2025") {
            return NextResponse.json<ApiErrorBody>({ error: "Not found.", code: "NOT_FOUND" }, { status: 404 });
        }
    }
    console.error("[api] unhandled error:", error);
    return NextResponse.json<ApiErrorBody>({ error: "Something went wrong. Give it another try.", code: "INTERNAL_ERROR" }, { status: 500 });
}
export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
    let raw: unknown;
    try {
        raw = await request.json();
    }
    catch {
        throw new ValidationError("Request body must be valid JSON.");
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error);
        throw new ValidationError(flattened.formErrors[0] ?? "Some of the information provided is not valid.", flattened.fieldErrors as Record<string, string[]>);
    }
    return parsed.data;
}
