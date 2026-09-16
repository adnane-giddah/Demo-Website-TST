export class AppError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status: number, code: string) {
        super(message);
        this.name = new.target.name;
        this.status = status;
        this.code = code;
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "You must be signed in to do that.") {
        super(message, 401, "UNAUTHORIZED");
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to do that.") {
        super(message, 403, "FORBIDDEN");
    }
}
export class NotFoundError extends AppError {
    constructor(message = "Not found.") {
        super(message, 404, "NOT_FOUND");
    }
}
export class ConflictError extends AppError {
    constructor(message = "That conflicts with the current state.") {
        super(message, 409, "CONFLICT");
    }
}
export class ValidationError extends AppError {
    readonly fieldErrors: Record<string, string[]>;
    constructor(message = "Some of the information provided is not valid.", fieldErrors: Record<string, string[]> = {}) {
        super(message, 422, "VALIDATION_ERROR");
        this.fieldErrors = fieldErrors;
    }
}
export class RateLimitError extends AppError {
    readonly retryAfterSeconds: number;
    constructor(retryAfterSeconds: number) {
        super(`Too many attempts. Please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`, 429, "RATE_LIMITED");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
