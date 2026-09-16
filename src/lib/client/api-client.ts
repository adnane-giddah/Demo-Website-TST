export class ApiClientError extends Error {
    readonly status: number;
    readonly code: string;
    readonly fieldErrors: Record<string, string[]>;
    constructor(message: string, status: number, code: string, fieldErrors: Record<string, string[]> = {}) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.code = code;
        this.fieldErrors = fieldErrors;
    }
}
type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    signal?: AbortSignal;
};
export async function apiRequest<T = unknown>(url: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch(url, {
            method,
            signal,
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
            credentials: "same-origin",
        });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
            throw error;
        throw new ApiClientError("Couldn't reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
    }
    if (response.status === 204)
        return undefined as T;
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        }
        catch {
            payload = null;
        }
    }
    if (!response.ok) {
        const data = (payload ?? {}) as {
            error?: string;
            code?: string;
            fieldErrors?: Record<string, string[]>;
        };
        throw new ApiClientError(data.error ?? "Something went wrong. Give it another try.", response.status, data.code ?? "UNKNOWN", data.fieldErrors ?? {});
    }
    return payload as T;
}
