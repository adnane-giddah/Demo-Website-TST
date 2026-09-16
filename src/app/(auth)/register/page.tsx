import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
export const metadata: Metadata = { title: "Request an account" };
export default function RegisterPage() {
    return <RegisterForm />;
}
