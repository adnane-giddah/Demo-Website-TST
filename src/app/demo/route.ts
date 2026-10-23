import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/demo/mode";
import { isProduction } from "@/lib/env";
// "Demo as an administrator": no account, no database. A cookie switches the
// app onto the in-memory dummy dataset and the visitor lands in /admin.
export function GET(request: Request) {
    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.set(DEMO_COOKIE, "1", {
        httpOnly: true, sameSite: "lax", secure: isProduction, path: "/", maxAge: 60 * 60 * 6,
    });
    return response;
}
