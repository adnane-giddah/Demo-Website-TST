import { z } from "zod";
export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const WEIGHT_MIN = 0.01;
export const WEIGHT_MAX = 100;
const nameField = z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters.");
const emailField = z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email is too long.")
    .pipe(z.email("Enter a valid email address."))
    .transform((value) => value.toLowerCase());
const passwordField = z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200, "Password must be at most 200 characters.")
    .refine((value) => /[a-zA-Z]/.test(value), {
    message: "Password must contain at least one letter.",
})
    .refine((value) => /[0-9]/.test(value), {
    message: "Password must contain at least one number.",
});
function optionalText(max: number, label: string) {
    return z
        .string()
        .max(max, `${label} must be at most ${max} characters.`)
        .transform((value) => {
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
    })
        .nullish()
        .transform((value) => value ?? null);
}
export const registerSchema = z
    .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});
export type RegisterInput = z.infer<typeof registerSchema>;
export const loginSchema = z.object({
    email: z.string().trim().min(1, "Email is required.").transform((v) => v.toLowerCase()),
    password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;
export const contestStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]);
const eventDateField = z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((value, ctx) => {
    if (value === null || value === undefined || value === "")
        return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date." });
        return null;
    }
    return date;
});
export const contestCreateSchema = z.object({
    title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters.")
        .max(140, "Title must be at most 140 characters."),
    description: optionalText(2000, "Description"),
    eventDate: eventDateField,
    status: contestStatusSchema.default("DRAFT"),
});
export const contestUpdateSchema = contestCreateSchema.partial();
export type ContestCreateInput = z.infer<typeof contestCreateSchema>;
export const problemCreateSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required.")
        .max(140, "Title must be at most 140 characters."),
    statementLatex: z
        .string()
        .trim()
        .min(1, "A problem statement is required.")
        .max(20000, "Statement must be at most 20 000 characters."),
    source: optionalText(200, "Source"),
    privateNotes: optionalText(4000, "Private notes"),
});
export const problemUpdateSchema = problemCreateSchema.partial();
export type ProblemCreateInput = z.infer<typeof problemCreateSchema>;
export const problemReorderSchema = z.object({
    orderedIds: z
        .array(z.string().min(1))
        .min(1, "At least one problem is required.")
        .max(500, "Too many problems in one request."),
});
export const weightSchema = z.coerce
    .number({ error: "Weight must be a number." })
    .min(WEIGHT_MIN, `Weight must be at least ${WEIGHT_MIN}.`)
    .max(WEIGHT_MAX, `Weight must be at most ${WEIGHT_MAX}.`)
    .refine((value) => Number.isFinite(value), { message: "Weight must be a number." })
    .transform((value) => Math.round(value * 100) / 100);
export const permissionUpdateSchema = z
    .object({
    userId: z.string().min(1),
    canView: z.boolean().optional(),
    canVote: z.boolean().optional(),
    weight: weightSchema.optional(),
})
    .refine((data) => data.canView !== undefined ||
    data.canVote !== undefined ||
    data.weight !== undefined, { message: "Nothing to update." });
export type PermissionUpdateInput = z.infer<typeof permissionUpdateSchema>;
const ratingField = z
    .number()
    .int("Ratings must be whole numbers.")
    .min(RATING_MIN, `Ratings must be between ${RATING_MIN} and ${RATING_MAX}.`)
    .max(RATING_MAX, `Ratings must be between ${RATING_MIN} and ${RATING_MAX}.`)
    .nullable();
export const voteSchema = z
    .object({
    problemId: z.string().min(1, "A problem is required."),
    beauty: ratingField.optional(),
    difficulty: ratingField.optional(),
})
    .refine((data) => data.beauty !== undefined || data.difficulty !== undefined, { message: "Provide at least one rating." });
export type VoteInput = z.infer<typeof voteSchema>;
export const userStatusSchema = z.enum(["PENDING", "APPROVED", "SUSPENDED", "REMOVED",
]);
export const userRoleSchema = z.enum(["USER", "ADMIN", "SUPER_ADMIN"]);
export const userUpdateSchema = z
    .object({
    status: userStatusSchema.optional(),
    role: userRoleSchema.optional(),
})
    .refine((data) => data.status !== undefined || data.role !== undefined, {
    message: "Nothing to update.",
});
