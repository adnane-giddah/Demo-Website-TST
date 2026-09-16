import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeScript } from "@/components/shared/theme-script";
import { Watermark } from "@/components/shared/watermark";
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});
const sourceSerif = Source_Serif_4({
    subsets: ["latin"],
    variable: "--font-source-serif",
    display: "swap",
    style: ["normal", "italic"],
});
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
});
export const metadata: Metadata = {
    title: {
        default: "Olympiad Portal",
        template: "%s · Olympiad Portal",
    },
    description: "A private platform for mathematical olympiad problem development, review and weighted rating.",
    robots: { index: false, follow: false },
};
export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
    ],
    width: "device-width",
    initialScale: 1,
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en" suppressHydrationWarning>
 <head>
 <ThemeScript />
 </head>
 <body className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} min-h-dvh antialiased`}>
 {children}
 <Watermark />
 <Toaster />
 </body>
 </html>);
}
